const {
  withDangerousMod,
  withEntitlementsPlist,
  withInfoPlist,
  withXcodeProject,
  withAndroidManifest,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// iOS: Swift native module — HKWorkoutSession + CMMotionManager fall detection
// ---------------------------------------------------------------------------
// Uses CMDeviceMotion.userAcceleration (gravity-subtracted, values in Gs)
// which matches expo-sensors DeviceMotion.acceleration used in JS.
// HKWorkoutSession (iOS 26+) keeps the process alive in background.
// CMMotionManager works on all iOS versions for foreground detection and
// continues in background when HKWorkoutSession is active.
const SWIFT_MODULE = `import Foundation
import HealthKit
import CoreMotion
import CoreLocation
import UserNotifications
import React

@objc(BackgroundWorkoutModule)
class BackgroundWorkoutModule: RCTEventEmitter, UNUserNotificationCenterDelegate, CLLocationManagerDelegate {

  private var healthStore: HKHealthStore?
  private var workoutSession: Any?

  // CoreMotion fall detection
  private var motionManager: CMMotionManager?
  private var motionQueue: OperationQueue?
  private var hasListeners = false

  // Fall detection state machine
  private enum DetectionPhase { case idle, collectingStillness }
  private var detectionPhase: DetectionPhase = .idle
  private var stillnessReadings: [Double] = []
  private var lastFallAlertTime: TimeInterval = 0

  // Thresholds in Gs
  private let IMPACT_THRESHOLD: Double = 6.5
  private let STILLNESS_THRESHOLD: Double = 0.5
  private let MAX_STILLNESS_READING: Double = 0.8
  private let STILLNESS_COUNT: Int = 20
  private let FALL_COOLDOWN_SECONDS: TimeInterval = 60

  // Persistent pending fall flag
  private let PENDING_FALL_KEY = "steadiday_pending_fall_timestamp"

  // Server-backed escalation
  private var escalationBackendUrl: String?
  private var escalationAuthKey: String?
  private var escalationSessionId: String?
  private var locationManager: CLLocationManager?
  private var pendingLocationCompletion: ((Double, Double) -> Void)?
  private weak var previousNotificationDelegate: UNUserNotificationCenterDelegate?

  @objc override static func requiresMainQueueSetup() -> Bool { return false }

  override func supportedEvents() -> [String] {
    return ["onNativeFallDetected"]
  }

  override func startObserving() { hasListeners = true }
  override func stopObserving() { hasListeners = false }

  // MARK: - Pending Fall Persistence

  private func storePendingFall() {
    let ts = Date().timeIntervalSince1970 * 1000 // milliseconds, matches JS Date.now()
    UserDefaults.standard.set(ts, forKey: PENDING_FALL_KEY)
  }

  private func clearPendingFall() {
    UserDefaults.standard.removeObject(forKey: PENDING_FALL_KEY)
  }

  @objc func consumePendingFallAlert(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let ts = UserDefaults.standard.double(forKey: PENDING_FALL_KEY)
    if ts > 0 {
      clearPendingFall()
      resolve(ts)
    } else {
      resolve(0)
    }
  }

  // MARK: - HealthKit Authorization

  @objc func requestAuthorization(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard HKHealthStore.isHealthDataAvailable() else {
      reject("E_UNAVAILABLE", "HealthKit is not available on this device", nil)
      return
    }

    let store = HKHealthStore()
    self.healthStore = store

    let typesToShare: Set<HKSampleType> = [HKObjectType.workoutType()]
    let typesToRead: Set<HKObjectType> = [HKObjectType.workoutType()]

    store.requestAuthorization(toShare: typesToShare, read: typesToRead) { success, error in
      if let error = error {
        reject("E_AUTH_FAILED", error.localizedDescription, error)
      } else {
        resolve(success)
      }
    }
  }

  // MARK: - Session Start/Stop

  @objc func startSession(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    // Always start accelerometer — works on all iOS versions
    registerNotificationCategory()
    startAccelerometer()

    // Try to start HKWorkoutSession for background execution (iOS 26+)
    if #available(iOS 26.0, *) {
      guard HKHealthStore.isHealthDataAvailable() else {
        // No HealthKit but accelerometer is running
        resolve(true)
        return
      }

      if healthStore == nil {
        healthStore = HKHealthStore()
      }

      guard let store = healthStore else {
        resolve(true)
        return
      }

      if let existing = workoutSession as? HKWorkoutSession, existing.state == .running {
        resolve(true)
        return
      }

      let config = HKWorkoutConfiguration()
      config.activityType = .other
      config.locationType = .unknown

      do {
        let session = try HKWorkoutSession(healthStore: store, configuration: config)
        self.workoutSession = session
        session.startActivity(with: Date())
        resolve(true)
      } catch {
        // HKWorkoutSession failed but accelerometer is still running
        resolve(true)
      }
    } else {
      // Pre-iOS 26: accelerometer runs in foreground only (no HKWorkoutSession)
      resolve(true)
    }
  }

  @objc func stopSession(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    stopAccelerometer()

    if #available(iOS 26.0, *) {
      if let session = workoutSession as? HKWorkoutSession {
        session.end()
        self.workoutSession = nil
      }
    }

    resolve(true)
  }

  @objc func isRunning(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    let accelRunning = motionManager?.isDeviceMotionActive ?? false
    if #available(iOS 26.0, *) {
      let sessionRunning = (workoutSession as? HKWorkoutSession)?.state == .running
      resolve(accelRunning || sessionRunning)
    } else {
      resolve(accelRunning)
    }
  }

  @objc func acknowledgeFallAlert(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    clearPendingFall()
    let center = UNUserNotificationCenter.current()
    center.removeDeliveredNotifications(withIdentifiers: ["steadiday-fall-detected"])
    center.removePendingNotificationRequests(withIdentifiers: ["steadiday-fall-detected"])
    resolve(true)
  }

  // MARK: - Server-Backed Escalation

  @objc func configureEscalation(
    _ backendUrl: String,
    authKey: String,
    sessionId: String,
    resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    self.escalationBackendUrl = backendUrl
    self.escalationAuthKey = authKey
    self.escalationSessionId = sessionId

    // Set up location manager for GPS fixes
    if locationManager == nil {
      let lm = CLLocationManager()
      lm.delegate = self
      lm.desiredAccuracy = kCLLocationAccuracyHundredMeters
      self.locationManager = lm
    }

    // Take over notification delegate to handle "I'm OK" natively
    let center = UNUserNotificationCenter.current()
    if !(center.delegate is BackgroundWorkoutModule) {
      self.previousNotificationDelegate = center.delegate
      center.delegate = self
    }

    resolve(true)
  }

  private func reportFallToBackend() {
    guard let baseUrl = escalationBackendUrl,
          let authKey = escalationAuthKey,
          let sessionId = escalationSessionId else { return }

    // Get GPS fix then send
    getQuickLocation { [weak self] lat, lng in
      self?.sendFallAlert(baseUrl: baseUrl, authKey: authKey, sessionId: sessionId, latitude: lat, longitude: lng, attempt: 0)
    }
  }

  private func getQuickLocation(completion: @escaping (Double, Double) -> Void) {
    guard let lm = locationManager else {
      completion(0, 0)
      return
    }

    self.pendingLocationCompletion = completion

    // Try cached location first
    if let cached = lm.location, Date().timeIntervalSince(cached.timestamp) < 120 {
      self.pendingLocationCompletion = nil
      completion(cached.coordinate.latitude, cached.coordinate.longitude)
      return
    }

    // Request single location update with 3s timeout
    lm.requestLocation()
    DispatchQueue.global().asyncAfter(deadline: .now() + 3.0) { [weak self] in
      if let pending = self?.pendingLocationCompletion {
        self?.pendingLocationCompletion = nil
        pending(0, 0)
      }
    }
  }

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard let location = locations.last, let completion = pendingLocationCompletion else { return }
    pendingLocationCompletion = nil
    completion(location.coordinate.latitude, location.coordinate.longitude)
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    guard let completion = pendingLocationCompletion else { return }
    pendingLocationCompletion = nil
    completion(0, 0)
  }

  private func sendFallAlert(baseUrl: String, authKey: String, sessionId: String, latitude: Double, longitude: Double, attempt: Int) {
    let maxRetries = 3
    let idempotencyKey = "fall_\\(sessionId)_\\(Int(Date().timeIntervalSince1970))"

    guard let url = URL(string: "\\(baseUrl)/api/emergency/fall-alert") else { return }
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue(authKey, forHTTPHeaderField: "X-App-Key")
    request.timeoutInterval = 10

    let body: [String: Any] = [
      "sessionId": sessionId,
      "idempotencyKey": idempotencyKey,
      "latitude": latitude,
      "longitude": longitude,
    ]
    request.httpBody = try? JSONSerialization.data(withJSONObject: body)

    URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
      let httpResponse = response as? HTTPURLResponse
      let statusOk = httpResponse != nil && (200...299).contains(httpResponse!.statusCode)

      if error != nil || !statusOk {
        if attempt < maxRetries - 1 {
          let delays: [Double] = [0, 2, 4]
          let delay = delays[min(attempt + 1, delays.count - 1)]
          DispatchQueue.global().asyncAfter(deadline: .now() + delay) {
            self?.sendFallAlert(baseUrl: baseUrl, authKey: authKey, sessionId: sessionId, latitude: latitude, longitude: longitude, attempt: attempt + 1)
          }
        }
        return
      }
    }.resume()
  }

  private func cancelFallOnBackend() {
    guard let baseUrl = escalationBackendUrl,
          let authKey = escalationAuthKey,
          let sessionId = escalationSessionId else { return }

    guard let url = URL(string: "\\(baseUrl)/api/emergency/fall-cancel") else { return }
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue(authKey, forHTTPHeaderField: "X-App-Key")
    request.timeoutInterval = 10

    let body: [String: Any] = ["sessionId": sessionId]
    request.httpBody = try? JSONSerialization.data(withJSONObject: body)

    URLSession.shared.dataTask(with: request) { _, _, _ in }.resume()
  }

  // MARK: - UNUserNotificationCenterDelegate (native "I'm OK" handling)

  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
    if response.notification.request.content.categoryIdentifier == "fallDetection" && response.actionIdentifier == "FALL_OK" {
      cancelFallOnBackend()
      clearPendingFall()
      center.removeDeliveredNotifications(withIdentifiers: ["steadiday-fall-detected"])
      completionHandler()
      return
    }
    // Forward to previous delegate
    if let prev = previousNotificationDelegate {
      prev.userNotificationCenter?(center, didReceive: response, withCompletionHandler: completionHandler)
    } else {
      completionHandler()
    }
  }

  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    if let prev = previousNotificationDelegate {
      prev.userNotificationCenter?(center, willPresent: notification, withCompletionHandler: completionHandler)
    } else {
      completionHandler([.sound, .banner])
    }
  }

  // MARK: - CoreMotion Accelerometer

  private func startAccelerometer() {
    guard motionManager == nil else { return }

    let manager = CMMotionManager()
    guard manager.isDeviceMotionAvailable else { return }

    manager.deviceMotionUpdateInterval = 0.1 // 100ms

    let queue = OperationQueue()
    queue.name = "com.vibecode.steadiday.motion"
    queue.maxConcurrentOperationCount = 1 // serial queue for thread-safe state mutation

    self.motionManager = manager
    self.motionQueue = queue
    self.detectionPhase = .idle
    self.stillnessReadings = []

    manager.startDeviceMotionUpdates(to: queue) { [weak self] motion, error in
      guard let self = self, let motion = motion else { return }
      // CMDeviceMotion.userAcceleration: gravity-subtracted, values in Gs.
      // At rest: ~0G on all axes. During a fall impact: 4-8G+.
      // No unit conversion needed — thresholds are already in Gs.
      let a = motion.userAcceleration
      let magnitudeInGs = sqrt(a.x * a.x + a.y * a.y + a.z * a.z)
      self.processAccelerometerReading(magnitudeInGs)
    }
  }

  private func stopAccelerometer() {
    motionManager?.stopDeviceMotionUpdates()
    motionManager = nil
    motionQueue = nil
    detectionPhase = .idle
    stillnessReadings = []
  }

  // MARK: - Fall Detection State Machine
  //
  // States:
  //   idle                — monitoring every reading for impact >= 6.5G
  //   collectingStillness — impact detected; collecting 20 readings (2s) to verify stillness
  //
  // Transitions:
  //   idle + impact >= 6.5G                                       -> collectingStillness (clear)
  //   collectingStillness + 20 readings with avg<0.5G & max<0.8G  -> FALL DETECTED -> idle
  //   collectingStillness + 20 readings that fail criteria         -> idle (reset)
  //   collectingStillness + new impact >= 6.5G                     -> restart collection
  //   any state + within 60s cooldown                              -> no-op

  private func processAccelerometerReading(_ magnitudeInGs: Double) {
    let now = Date().timeIntervalSince1970
    if now - lastFallAlertTime < FALL_COOLDOWN_SECONDS { return }

    switch detectionPhase {
    case .idle:
      if magnitudeInGs >= IMPACT_THRESHOLD {
        detectionPhase = .collectingStillness
        stillnessReadings = []
      }

    case .collectingStillness:
      // Another strong impact during collection restarts the observation window
      if magnitudeInGs >= IMPACT_THRESHOLD {
        stillnessReadings = []
        return
      }

      stillnessReadings.append(magnitudeInGs)

      if stillnessReadings.count >= STILLNESS_COUNT {
        let avg = stillnessReadings.reduce(0, +) / Double(stillnessReadings.count)
        let peak = stillnessReadings.max() ?? 0

        if avg < STILLNESS_THRESHOLD && peak < MAX_STILLNESS_READING {
          // Fall confirmed: impact followed by sustained stillness
          lastFallAlertTime = now
          detectionPhase = .idle
          stillnessReadings = []
          DispatchQueue.main.async { [weak self] in
            self?.onFallDetected()
          }
        } else {
          // Stillness criteria not met — reset
          detectionPhase = .idle
          stillnessReadings = []
        }
      }
    }
  }

  // MARK: - Fall Detected Handler

  private func onFallDetected() {
    // Persist pending fall so JS can pick it up on cold start / resume
    storePendingFall()

    // Report to backend for server-backed escalation
    reportFallToBackend()

    // Fire local notification
    let content = UNMutableNotificationContent()
    content.title = "Fall Detected - Are you okay?"
    content.body = "Tap to respond. Emergency contacts will be notified in 30 seconds if you do not respond."
    content.sound = .default
    content.categoryIdentifier = "fallDetection"
    content.interruptionLevel = .timeSensitive

    let request = UNNotificationRequest(
      identifier: "steadiday-fall-detected",
      content: content,
      trigger: nil
    )

    UNUserNotificationCenter.current().add(request) { _ in }

    // Emit event to JS (if listeners are active / app is foregrounded)
    if hasListeners {
      sendEvent(withName: "onNativeFallDetected", body: [
        "timestamp": Date().timeIntervalSince1970 * 1000
      ])
    }
  }

  // MARK: - Notification Category (merged with existing expo categories)

  private func registerNotificationCategory() {
    let center = UNUserNotificationCenter.current()
    center.getNotificationCategories { existing in
      let okAction = UNNotificationAction(
        identifier: "FALL_OK",
        title: "I am OK",
        options: []
      )
      let emergencyAction = UNNotificationAction(
        identifier: "FALL_EMERGENCY",
        title: "Call 911",
        options: [.foreground, .destructive]
      )
      let fallCategory = UNNotificationCategory(
        identifier: "fallDetection",
        actions: [okAction, emergencyAction],
        intentIdentifiers: [],
        options: [.customDismissAction]
      )
      // Merge: keep all existing categories, replace any prior fallDetection
      var merged = existing.filter { $0.identifier != "fallDetection" }
      merged.insert(fallCategory)
      center.setNotificationCategories(merged)
    }
  }
}
`;

// ObjC bridge to expose Swift module to React Native
const OBJC_BRIDGE = `#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(BackgroundWorkoutModule, RCTEventEmitter)

RCT_EXTERN_METHOD(requestAuthorization:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(startSession:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopSession:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(isRunning:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(acknowledgeFallAlert:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(consumePendingFallAlert:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(configureEscalation:(NSString *)backendUrl
                  authKey:(NSString *)authKey
                  sessionId:(NSString *)sessionId
                  resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
`;

// ---------------------------------------------------------------------------
// Android: Java foreground service + native module for fall detection
// ---------------------------------------------------------------------------
// Uses TYPE_LINEAR_ACCELERATION (gravity-subtracted, values in m/s2).
// Falls back to TYPE_ACCELEROMETER if linear accel unavailable.
// Converts m/s2 to Gs (divide by 9.80665) before applying thresholds.

const ANDROID_SERVICE_JAVA = `package com.vibecode.steadiday;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.location.Location;
import android.location.LocationManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

import androidx.core.app.NotificationCompat;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;

public class FallDetectionService extends Service implements SensorEventListener {

    private static final String SESSION_CHANNEL_ID = "steadiday_safety_session";
    private static final String FALL_CHANNEL_ID = "steadiday_fall_alert";
    private static final int SESSION_NOTIFICATION_ID = 9001;
    private static final int FALL_NOTIFICATION_ID = 9002;

    // Thresholds in Gs — matches iOS and JS.
    // SensorManager values arrive in m/s2 and are converted to Gs below.
    private static final double IMPACT_THRESHOLD = 6.5;
    private static final double STILLNESS_THRESHOLD = 0.5;
    private static final double MAX_STILLNESS_READING = 0.8;
    private static final int STILLNESS_COUNT = 20; // 20 readings x ~100ms = 2 seconds
    private static final long FALL_COOLDOWN_MS = 60000;

    // Standard gravity in m/s2 — used to convert sensor values to Gs
    private static final double G_FORCE = 9.80665;

    // Persistent pending fall flag
    private static final String PREFS_NAME = "steadiday_fall_detection";
    private static final String PENDING_FALL_KEY = "pending_fall_timestamp";

    private SensorManager sensorManager;
    private Sensor sensor;
    private boolean usingLinearAccel = false;
    private PowerManager.WakeLock wakeLock;

    // Fall detection state machine
    // STATE_IDLE: monitoring for impact >= IMPACT_THRESHOLD
    // STATE_COLLECTING_STILLNESS: post-impact, collecting readings to verify sustained stillness
    private static final int STATE_IDLE = 0;
    private static final int STATE_COLLECTING_STILLNESS = 1;
    private int detectionState = STATE_IDLE;
    private final ArrayList<Double> stillnessReadings = new ArrayList<>();
    private long lastFallAlertTime = 0;

    private static FallDetectionService instance;
    private static FallEventCallback fallEventCallback;

    // Server-backed escalation
    private static String escalationBackendUrl;
    private static String escalationAuthKey;
    private static String escalationSessionId;

    public static void configureEscalation(String backendUrl, String authKey, String sessionId) {
        escalationBackendUrl = backendUrl;
        escalationAuthKey = authKey;
        escalationSessionId = sessionId;
    }

    public interface FallEventCallback {
        void onFallDetected(double timestamp);
    }

    public static void setFallEventCallback(FallEventCallback cb) {
        fallEventCallback = cb;
    }

    public static FallDetectionService getInstance() {
        return instance;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        createNotificationChannels();

        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);

        // Prefer TYPE_LINEAR_ACCELERATION: values are in m/s2, gravity already
        // subtracted by the device sensor fusion algorithm. Equivalent to iOS
        // CMDeviceMotion.userAcceleration. At rest: ~0 m/s2. During impact: 60+ m/s2.
        sensor = sensorManager.getDefaultSensor(Sensor.TYPE_LINEAR_ACCELERATION);
        if (sensor != null) {
            usingLinearAccel = true;
        } else {
            // Fallback: raw accelerometer includes gravity (~9.81 m/s2 at rest).
            // We approximate dynamic acceleration by subtracting 1G from the scalar
            // magnitude. See onSensorChanged for the conversion.
            sensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            usingLinearAccel = false;
        }

        // Acquire partial wake lock to keep CPU active for sensor delivery
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "steadiday:fall-detection"
            );
            wakeLock.acquire();
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(SESSION_NOTIFICATION_ID, buildSessionNotification());

        if (sensor != null) {
            // SENSOR_DELAY_GAME is ~20ms; the state machine processes each reading
            sensorManager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_GAME);
        }

        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        instance = null;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    // --- Sensor Callbacks ---

    @Override
    public void onSensorChanged(SensorEvent event) {
        float x = event.values[0];
        float y = event.values[1];
        float z = event.values[2];

        // SensorManager delivers values in m/s2. Convert to Gs for threshold comparison.
        double magnitudeMs2 = Math.sqrt(x * x + y * y + z * z);
        double magnitudeInGs;

        if (usingLinearAccel) {
            // TYPE_LINEAR_ACCELERATION: gravity already subtracted by sensor fusion.
            // At rest: ~0 m/s2.  Divide by 9.80665 to get Gs.
            // Example: 63.7 m/s2 impact / 9.80665 = 6.5G
            magnitudeInGs = magnitudeMs2 / G_FORCE;
        } else {
            // TYPE_ACCELEROMETER: includes gravity (~9.81 m/s2 at rest).
            // Approximate dynamic acceleration by subtracting 1G from magnitude.
            // At rest: sqrt(x2+y2+z2) ~ 9.81 -> 9.81/9.81 - 1.0 = 0G. Correct.
            // During impact: sqrt(...) ~ 73 -> 73/9.81 - 1.0 = 6.4G. Close.
            // This scalar approximation has error bounded to ~1G because gravity
            // is a vector that may add to or subtract from the impact direction.
            // At the 6.5G threshold, worst-case error is ~15%, acceptable for
            // fall detection where real impacts are typically 4-8G.
            magnitudeInGs = Math.abs(magnitudeMs2 / G_FORCE - 1.0);
        }

        processAccelerometerReading(magnitudeInGs);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    // --- Fall Detection State Machine ---
    //
    // States:
    //   STATE_IDLE                — monitoring every reading for impact >= 6.5G
    //   STATE_COLLECTING_STILLNESS — impact detected; collecting 20 readings (2s)
    //
    // Transitions:
    //   idle + impact >= 6.5G                                       -> collectingStillness
    //   collectingStillness + 20 readings with avg<0.5G & max<0.8G  -> FALL DETECTED -> idle
    //   collectingStillness + 20 readings that fail criteria         -> idle (reset)
    //   collectingStillness + new impact >= 6.5G                     -> restart collection
    //   any state + within 60s cooldown                              -> no-op

    private void processAccelerometerReading(double magnitudeInGs) {
        long now = System.currentTimeMillis();
        if (now - lastFallAlertTime < FALL_COOLDOWN_MS) return;

        switch (detectionState) {
            case STATE_IDLE:
                if (magnitudeInGs >= IMPACT_THRESHOLD) {
                    detectionState = STATE_COLLECTING_STILLNESS;
                    stillnessReadings.clear();
                }
                break;

            case STATE_COLLECTING_STILLNESS:
                // Another strong impact restarts the stillness observation window
                if (magnitudeInGs >= IMPACT_THRESHOLD) {
                    stillnessReadings.clear();
                    break;
                }

                stillnessReadings.add(magnitudeInGs);

                if (stillnessReadings.size() >= STILLNESS_COUNT) {
                    double sum = 0;
                    double peak = 0;
                    for (double val : stillnessReadings) {
                        sum += val;
                        peak = Math.max(peak, val);
                    }
                    double avg = sum / stillnessReadings.size();

                    if (avg < STILLNESS_THRESHOLD && peak < MAX_STILLNESS_READING) {
                        // Fall confirmed: impact followed by sustained stillness
                        lastFallAlertTime = now;
                        detectionState = STATE_IDLE;
                        stillnessReadings.clear();
                        onFallDetected();
                    } else {
                        // Stillness criteria not met — reset
                        detectionState = STATE_IDLE;
                        stillnessReadings.clear();
                    }
                }
                break;
        }
    }

    private void onFallDetected() {
        // Persist pending fall so JS can pick it up on cold start / resume
        storePendingFall();

        // Report to backend for server-backed escalation
        reportFallToBackend();

        // Show high-priority notification with "I'm OK" action
        showFallNotification();

        // Emit event to JS via callback
        if (fallEventCallback != null) {
            fallEventCallback.onFallDetected(System.currentTimeMillis());
        }
    }

    private void reportFallToBackend() {
        if (escalationBackendUrl == null || escalationAuthKey == null || escalationSessionId == null) return;

        final String baseUrl = escalationBackendUrl;
        final String authKey = escalationAuthKey;
        final String sessionId = escalationSessionId;

        // Get location then send
        double lat = 0;
        double lng = 0;
        try {
            LocationManager lm = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
            if (lm != null) {
                Location cached = lm.getLastKnownLocation(LocationManager.FUSED_PROVIDER);
                if (cached == null) cached = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                if (cached == null) cached = lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                if (cached != null) {
                    lat = cached.getLatitude();
                    lng = cached.getLongitude();
                }
            }
        } catch (SecurityException ignored) {}

        final double latitude = lat;
        final double longitude = lng;

        new Thread(() -> sendFallAlertHttp(baseUrl, authKey, sessionId, latitude, longitude, 0)).start();
    }

    private void sendFallAlertHttp(String baseUrl, String authKey, String sessionId, double lat, double lng, int attempt) {
        int maxRetries = 3;
        String idempotencyKey = "fall_" + sessionId + "_" + (System.currentTimeMillis() / 1000);
        try {
            URL url = new URL(baseUrl + "/api/emergency/fall-alert");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("X-App-Key", authKey);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);
            conn.setDoOutput(true);

            String json = "{\\"sessionId\\":\\"" + sessionId + "\\",\\"idempotencyKey\\":\\"" + idempotencyKey + "\\",\\"latitude\\":" + lat + ",\\"longitude\\":" + lng + "}";
            OutputStream os = conn.getOutputStream();
            os.write(json.getBytes(StandardCharsets.UTF_8));
            os.close();

            int code = conn.getResponseCode();
            conn.disconnect();
            if (code >= 200 && code < 300) return;
        } catch (Exception ignored) {}

        if (attempt < maxRetries - 1) {
            long[] delays = {0, 2000, 4000};
            long delay = delays[Math.min(attempt + 1, delays.length - 1)];
            try { Thread.sleep(delay); } catch (InterruptedException ignored) {}
            sendFallAlertHttp(baseUrl, authKey, sessionId, lat, lng, attempt + 1);
        }
    }

    public static void cancelFallOnBackend() {
        if (escalationBackendUrl == null || escalationAuthKey == null || escalationSessionId == null) return;

        final String baseUrl = escalationBackendUrl;
        final String authKey = escalationAuthKey;
        final String sessionId = escalationSessionId;

        new Thread(() -> {
            try {
                URL url = new URL(baseUrl + "/api/emergency/fall-cancel");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("X-App-Key", authKey);
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);
                conn.setDoOutput(true);

                String json = "{\\"sessionId\\":\\"" + sessionId + "\\"}";
                OutputStream os = conn.getOutputStream();
                os.write(json.getBytes(StandardCharsets.UTF_8));
                os.close();

                conn.getResponseCode();
                conn.disconnect();
            } catch (Exception ignored) {}
        }).start();
    }

    // --- Pending Fall Persistence ---

    private void storePendingFall() {
        getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putLong(PENDING_FALL_KEY, System.currentTimeMillis())
            .apply();
    }

    public void clearPendingFall() {
        getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .remove(PENDING_FALL_KEY)
            .apply();
    }

    // --- Notifications ---

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);

            // Session channel (low importance, persistent service notification)
            NotificationChannel sessionChannel = new NotificationChannel(
                SESSION_CHANNEL_ID,
                "Safety Session",
                NotificationManager.IMPORTANCE_LOW
            );
            sessionChannel.setDescription("Active safety session monitoring");
            nm.createNotificationChannel(sessionChannel);

            // Fall alert channel (high importance)
            NotificationChannel fallChannel = new NotificationChannel(
                FALL_CHANNEL_ID,
                "Fall Alerts",
                NotificationManager.IMPORTANCE_HIGH
            );
            fallChannel.setDescription("Alerts when a fall is detected");
            fallChannel.enableVibration(true);
            nm.createNotificationChannel(fallChannel);
        }
    }

    private Notification buildSessionNotification() {
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pi = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, SESSION_CHANNEL_ID)
            .setContentTitle("Safety Session Active")
            .setContentText("Fall detection is monitoring in the background")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setOngoing(true)
            .setContentIntent(pi)
            .build();
    }

    private void showFallNotification() {
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            launchIntent.putExtra("fallDetected", true);
        }
        PendingIntent pi = PendingIntent.getActivity(
            this, 1, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // "I'm OK" action — handled natively via BroadcastReceiver, no JS needed
        Intent cancelIntent = new Intent(this, FallCancelReceiver.class);
        cancelIntent.setAction("FALL_CANCEL");
        PendingIntent cancelPi = PendingIntent.getBroadcast(
            this, 2, cancelIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = new NotificationCompat.Builder(this, FALL_CHANNEL_ID)
            .setContentTitle("Fall Detected - Are you okay?")
            .setContentText("Tap to respond. Emergency contacts will be notified in 30 seconds.")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setContentIntent(pi)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "I'm OK", cancelPi)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .build();

        NotificationManager nm = getSystemService(NotificationManager.class);
        nm.notify(FALL_NOTIFICATION_ID, notification);
    }

    public void clearFallNotification() {
        NotificationManager nm = getSystemService(NotificationManager.class);
        nm.cancel(FALL_NOTIFICATION_ID);
    }
}
`;

const ANDROID_MODULE_JAVA = `package com.vibecode.steadiday;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class FallDetectionModule extends ReactContextBaseJavaModule {

    private static final String PREFS_NAME = "steadiday_fall_detection";
    private static final String PENDING_FALL_KEY = "pending_fall_timestamp";
    private boolean hasListeners = false;

    public FallDetectionModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "FallDetectionModule";
    }

    @ReactMethod
    public void addListener(String eventName) {
        hasListeners = true;
    }

    @ReactMethod
    public void removeListeners(int count) {
        if (count == 0) hasListeners = false;
    }

    @ReactMethod
    public void startService(Promise promise) {
        try {
            ReactApplicationContext context = getReactApplicationContext();

            // Set up the callback to emit events to JS
            FallDetectionService.setFallEventCallback(new FallDetectionService.FallEventCallback() {
                @Override
                public void onFallDetected(double timestamp) {
                    if (hasListeners) {
                        WritableMap params = Arguments.createMap();
                        params.putDouble("timestamp", timestamp);
                        getReactApplicationContext()
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                            .emit("onNativeFallDetected", params);
                    }
                }
            });

            Intent intent = new Intent(context, FallDetectionService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent);
            } else {
                context.startService(intent);
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void stopService(Promise promise) {
        try {
            ReactApplicationContext context = getReactApplicationContext();
            Intent intent = new Intent(context, FallDetectionService.class);
            context.stopService(intent);
            FallDetectionService.setFallEventCallback(null);
            promise.resolve(true);
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void isRunning(Promise promise) {
        promise.resolve(FallDetectionService.getInstance() != null);
    }

    @ReactMethod
    public void acknowledgeFallAlert(Promise promise) {
        // Clear persistent pending fall flag
        ReactApplicationContext context = getReactApplicationContext();
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .remove(PENDING_FALL_KEY)
            .apply();

        // Clear notification
        FallDetectionService svc = FallDetectionService.getInstance();
        if (svc != null) {
            svc.clearFallNotification();
            svc.clearPendingFall();
        }
        promise.resolve(true);
    }

    @ReactMethod
    public void configureEscalation(String backendUrl, String authKey, String sessionId, Promise promise) {
        try {
            FallDetectionService.configureEscalation(backendUrl, authKey, sessionId);
            promise.resolve(true);
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void consumePendingFallAlert(Promise promise) {
        try {
            ReactApplicationContext context = getReactApplicationContext();

            // 1. Check SharedPreferences for persistent pending fall timestamp
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            long ts = prefs.getLong(PENDING_FALL_KEY, 0);

            // 2. Check launch intent for fallDetected extra (notification tap cold start)
            boolean fromIntent = false;
            Activity activity = getCurrentActivity();
            if (activity != null) {
                Intent intent = activity.getIntent();
                if (intent != null && intent.getBooleanExtra("fallDetected", false)) {
                    fromIntent = true;
                    // Clear the intent extra so it does not re-trigger on next check
                    intent.removeExtra("fallDetected");
                }
            }

            if (ts > 0) {
                // Clear the persistent flag — JS is now handling the alert
                prefs.edit().remove(PENDING_FALL_KEY).apply();
                promise.resolve((double) ts);
            } else if (fromIntent) {
                promise.resolve((double) System.currentTimeMillis());
            } else {
                promise.resolve(0.0);
            }
        } catch (Exception e) {
            promise.resolve(0.0);
        }
    }
}
`;

const ANDROID_CANCEL_RECEIVER_JAVA = `package com.vibecode.steadiday;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

public class FallCancelReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if ("FALL_CANCEL".equals(intent.getAction())) {
            // Cancel escalation on backend (native HTTP, no JS needed)
            FallDetectionService.cancelFallOnBackend();

            // Clear pending fall flag
            context.getSharedPreferences("steadiday_fall_detection", Context.MODE_PRIVATE)
                .edit()
                .remove("pending_fall_timestamp")
                .apply();

            // Clear the fall notification
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(9002);
            }

            // Clear via service instance if available
            FallDetectionService svc = FallDetectionService.getInstance();
            if (svc != null) {
                svc.clearPendingFall();
                svc.clearFallNotification();
            }
        }
    }
}
`;

const ANDROID_PACKAGE_JAVA = `package com.vibecode.steadiday;

import androidx.annotation.NonNull;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class FallDetectionPackage implements ReactPackage {

    @NonNull
    @Override
    public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new FallDetectionModule(reactContext));
        return modules;
    }

    @NonNull
    @Override
    public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
`;

// ---------------------------------------------------------------------------
// Helper: find iOS app directory
// ---------------------------------------------------------------------------
function findAppDir(platformRoot) {
  const entries = fs.readdirSync(platformRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (
      entry.isDirectory() &&
      !entry.name.endsWith(".xcodeproj") &&
      !entry.name.endsWith(".xcworkspace") &&
      entry.name !== "Pods" &&
      entry.name !== "build" &&
      !entry.name.startsWith(".")
    ) {
      const appDelegatePath = path.join(
        platformRoot,
        entry.name,
        "AppDelegate.swift"
      );
      const appDelegateM = path.join(
        platformRoot,
        entry.name,
        "AppDelegate.mm"
      );
      if (fs.existsSync(appDelegatePath) || fs.existsSync(appDelegateM)) {
        return entry.name;
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Config Plugin
// ---------------------------------------------------------------------------
const withBackgroundWorkout = (config) => {
  // =========================================================================
  // iOS Configuration
  // =========================================================================

  // 1. Entitlements: HealthKit
  config = withEntitlementsPlist(config, (config) => {
    config.modResults["com.apple.developer.healthkit"] = true;
    if (!config.modResults["com.apple.developer.healthkit.access"]) {
      config.modResults["com.apple.developer.healthkit.access"] = [];
    }
    return config;
  });

  // 2. Info.plist: background modes + workout write description
  config = withInfoPlist(config, (config) => {
    const modes = config.modResults.UIBackgroundModes || [];
    if (!modes.includes("processing")) {
      modes.push("processing");
    }
    config.modResults.UIBackgroundModes = modes;

    config.modResults.BGTaskSchedulerPermittedIdentifiers = ["com.vibecode.steadiday.background-workout"];

    config.modResults.NSHealthUpdateUsageDescription =
      "SteadiDay records a background safety workout session to keep fall detection active when the app is not in the foreground.";

    // Motion usage description for CMMotionManager
    if (!config.modResults.NSMotionUsageDescription) {
      config.modResults.NSMotionUsageDescription =
        "SteadiDay uses motion data to detect falls during your safety session.";
    }

    return config;
  });

  // 3. Write native iOS source files
  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const platformRoot = config.modRequest.platformProjectRoot;
      const appDir =
        findAppDir(platformRoot) || config.modRequest.projectName || "SteadiDay";
      const sourceDir = path.join(platformRoot, appDir);

      if (!fs.existsSync(sourceDir)) {
        fs.mkdirSync(sourceDir, { recursive: true });
      }

      fs.writeFileSync(
        path.join(sourceDir, "BackgroundWorkoutModule.swift"),
        SWIFT_MODULE,
        "utf8"
      );
      fs.writeFileSync(
        path.join(sourceDir, "BackgroundWorkoutModule.m"),
        OBJC_BRIDGE,
        "utf8"
      );

      console.log(
        "✅ BackgroundWorkoutModule native files created in",
        appDir
      );
      return config;
    },
  ]);

  // 4. Add iOS source files to Xcode project
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectName =
      config.modRequest.projectName || "SteadiDay";

    const swiftPath = `${projectName}/BackgroundWorkoutModule.swift`;
    const objcPath = `${projectName}/BackgroundWorkoutModule.m`;

    const hasSwift = project.hasFile(swiftPath);
    const hasObjc = project.hasFile(objcPath);

    if (!hasSwift) {
      project.addSourceFile(swiftPath, {}, project.getFirstProject().firstProject.mainGroup);
    }
    if (!hasObjc) {
      project.addSourceFile(objcPath, {}, project.getFirstProject().firstProject.mainGroup);
    }

    console.log("✅ BackgroundWorkoutModule files added to Xcode project");
    return config;
  });

  // =========================================================================
  // Android Configuration
  // =========================================================================

  // 5. AndroidManifest: permissions + service declaration
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Add permissions
    const permissions = manifest["uses-permission"] || [];
    const permNames = permissions.map((p) => p.$?.["android:name"]);

    const requiredPerms = [
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_HEALTH",
      "android.permission.POST_NOTIFICATIONS",
      "android.permission.HIGH_SAMPLING_RATE_SENSORS",
      "android.permission.ACTIVITY_RECOGNITION",
      "android.permission.WAKE_LOCK",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
    ];

    for (const perm of requiredPerms) {
      if (!permNames.includes(perm)) {
        permissions.push({ $: { "android:name": perm } });
      }
    }
    manifest["uses-permission"] = permissions;

    // Add service to application
    const app = manifest.application?.[0];
    if (app) {
      if (!app.service) app.service = [];

      const serviceExists = app.service.some(
        (s) => s.$?.["android:name"] === ".FallDetectionService"
      );

      if (!serviceExists) {
        app.service.push({
          $: {
            "android:name": ".FallDetectionService",
            "android:exported": "false",
            "android:foregroundServiceType": "health",
          },
        });
      }

      // Add FallCancelReceiver
      if (!app.receiver) app.receiver = [];
      const receiverExists = app.receiver.some(
        (r) => r.$?.["android:name"] === ".FallCancelReceiver"
      );
      if (!receiverExists) {
        app.receiver.push({
          $: {
            "android:name": ".FallCancelReceiver",
            "android:exported": "false",
          },
        });
      }
    }

    return config;
  });

  // 6. Write native Android source files + register package in MainApplication
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const androidRoot = config.modRequest.platformProjectRoot;
      const packageDir = path.join(
        androidRoot,
        "app",
        "src",
        "main",
        "java",
        "com",
        "vibecode",
        "steadiday"
      );

      if (!fs.existsSync(packageDir)) {
        fs.mkdirSync(packageDir, { recursive: true });
      }

      fs.writeFileSync(
        path.join(packageDir, "FallDetectionService.java"),
        ANDROID_SERVICE_JAVA,
        "utf8"
      );
      fs.writeFileSync(
        path.join(packageDir, "FallDetectionModule.java"),
        ANDROID_MODULE_JAVA,
        "utf8"
      );
      fs.writeFileSync(
        path.join(packageDir, "FallDetectionPackage.java"),
        ANDROID_PACKAGE_JAVA,
        "utf8"
      );
      fs.writeFileSync(
        path.join(packageDir, "FallCancelReceiver.java"),
        ANDROID_CANCEL_RECEIVER_JAVA,
        "utf8"
      );

      // ---------------------------------------------------------------
      // Register FallDetectionPackage in MainApplication (.kt or .java)
      // Expo SDK 53 generates MainApplication.kt (Kotlin) by default.
      // We must handle both Kotlin and Java, and be idempotent.
      // ---------------------------------------------------------------
      const mainAppDir = path.join(androidRoot, "app", "src", "main", "java", "com", "vibecode", "steadiday");
      const candidates = [
        path.join(mainAppDir, "MainApplication.kt"),
        path.join(mainAppDir, "MainApplication.java"),
      ];

      let patched = false;
      for (const appPath of candidates) {
        if (!fs.existsSync(appPath)) continue;
        let content = fs.readFileSync(appPath, "utf8");

        if (content.includes("FallDetectionPackage")) {
          patched = true;
          break;
        }

        const isKotlin = appPath.endsWith(".kt");

        if (isKotlin) {
          // --- Kotlin MainApplication.kt (Expo SDK 53 default) ---
          // Pattern: val packages = PackageList(this).packages
          //          // Packages that cannot be autolinked yet can be added manually here
          //          return packages
          //
          // We insert `packages.add(FallDetectionPackage())` before `return packages`
          // and add the import at the top.

          // 1. Add import (after the last existing import line)
          const importLine = "import com.vibecode.steadiday.FallDetectionPackage";
          if (!content.includes(importLine)) {
            // Find the last import statement and insert after it
            const importRegex = /^(import\s+.+)$/gm;
            let lastImportMatch = null;
            let match;
            while ((match = importRegex.exec(content)) !== null) {
              lastImportMatch = match;
            }
            if (lastImportMatch) {
              const insertPos = lastImportMatch.index + lastImportMatch[0].length;
              content = content.slice(0, insertPos) + "\n" + importLine + content.slice(insertPos);
            }
          }

          // 2. Add package registration before `return packages`
          const returnPackagesRegex = /(\s*)(return\s+packages\s*)/;
          const returnMatch = content.match(returnPackagesRegex);
          if (returnMatch) {
            const indent = returnMatch[1];
            const addLine = `${indent}packages.add(FallDetectionPackage())\n`;
            content = content.replace(returnPackagesRegex, addLine + "$1$2");
          }

          fs.writeFileSync(appPath, content, "utf8");
          patched = true;
          console.log("✅ FallDetectionPackage registered in MainApplication.kt");
        } else {
          // --- Java MainApplication.java (legacy / older Expo) ---
          // Pattern: List<ReactPackage> packages = new PackageList(this).getPackages();
          //          return packages;

          // 1. Add import
          const importLine = "import com.vibecode.steadiday.FallDetectionPackage;";
          if (!content.includes(importLine)) {
            const importRegex = /^(import\s+.+;)$/gm;
            let lastImportMatch = null;
            let match;
            while ((match = importRegex.exec(content)) !== null) {
              lastImportMatch = match;
            }
            if (lastImportMatch) {
              const insertPos = lastImportMatch.index + lastImportMatch[0].length;
              content = content.slice(0, insertPos) + "\n" + importLine + content.slice(insertPos);
            }
          }

          // 2. Add package registration before `return packages;`
          const returnRegex = /(\s*)(return\s+packages\s*;)/;
          const javaMatch = content.match(returnRegex);
          if (javaMatch) {
            const indent = javaMatch[1];
            const addLine = `${indent}packages.add(new FallDetectionPackage());\n`;
            content = content.replace(returnRegex, addLine + "$1$2");
          }

          fs.writeFileSync(appPath, content, "utf8");
          patched = true;
          console.log("✅ FallDetectionPackage registered in MainApplication.java");
        }

        break;
      }

      if (!patched) {
        console.warn("⚠️  Could not find MainApplication.kt or .java to register FallDetectionPackage. " +
          "The native module may not be available at runtime.");
      }

      console.log("✅ Android FallDetection native files created");
      return config;
    },
  ]);

  return config;
};

module.exports = withBackgroundWorkout;
