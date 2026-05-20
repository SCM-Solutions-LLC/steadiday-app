const {
  withDangerousMod,
  withEntitlementsPlist,
  withInfoPlist,
  withXcodeProject,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Swift native module: HKWorkoutSession for background fall detection
// NOTE: HKLiveWorkoutBuilder and HKLiveWorkoutDataSource are watchOS-only
// (not available on iOS until iOS 26). We use HKWorkoutSession alone
// (available iOS 17+) which is sufficient for background execution.
const SWIFT_MODULE = `import Foundation
import HealthKit
import React

@objc(BackgroundWorkoutModule)
class BackgroundWorkoutModule: NSObject {

  private var healthStore: HKHealthStore?
  private var workoutSession: Any?

  @objc static func requiresMainQueueSetup() -> Bool { return false }

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

  @objc func startSession(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if #available(iOS 26.0, *) {
      guard HKHealthStore.isHealthDataAvailable() else {
        reject("E_UNAVAILABLE", "HealthKit is not available", nil)
        return
      }

      if healthStore == nil {
        healthStore = HKHealthStore()
      }

      guard let store = healthStore else {
        reject("E_NO_STORE", "Could not create HealthStore", nil)
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
        reject("E_SESSION_CREATE", error.localizedDescription, error)
      }
    } else {
      reject("E_UNSUPPORTED", "HKWorkoutSession requires iOS 26 or later", nil)
    }
  }

  @objc func stopSession(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if #available(iOS 26.0, *) {
      guard let session = workoutSession as? HKWorkoutSession else {
        resolve(true)
        return
      }

      session.end()
      self.workoutSession = nil
      resolve(true)
    } else {
      resolve(true)
    }
  }

  @objc func isRunning(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    if #available(iOS 26.0, *) {
      resolve((workoutSession as? HKWorkoutSession)?.state == .running)
    } else {
      resolve(false)
    }
  }
}
`;

// ObjC bridge to expose Swift module to React Native
const OBJC_BRIDGE = `#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(BackgroundWorkoutModule, NSObject)

RCT_EXTERN_METHOD(requestAuthorization:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(startSession:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopSession:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(isRunning:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
`;

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

const withBackgroundWorkout = (config) => {
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

    return config;
  });

  // 3. Write native source files
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

  // 4. Add source files to Xcode project
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

  return config;
};

module.exports = withBackgroundWorkout;
