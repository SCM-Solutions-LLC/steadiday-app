import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import { Platform } from "react-native";
import { Language } from "../types/app";
import { logger } from "./logger";

const TTS_TIMEOUT_MS = 2000;

const LANGUAGE_TO_LOCALE: Record<Language, string> = {
  en: "en-US",
  es: "es-ES",
  zh: "zh-CN",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-BR",
  ja: "ja-JP",
  ko: "ko-KR",
  hi: "hi-IN",
};

const VOICE_TEST_MESSAGE: Record<Language, string> = {
  en: "Voice guidance is working. You will hear reminders read aloud when notifications arrive.",
  es: "La guía por voz está funcionando. Escuchará los recordatorios en voz alta cuando lleguen las notificaciones.",
  zh: "语音引导正在工作。当通知到达时，您将听到提醒被朗读出来。",
  fr: "Le guide vocal fonctionne. Vous entendrez les rappels lus à voix haute lorsque les notifications arriveront.",
  de: "Die Sprachführung funktioniert. Sie hören Erinnerungen laut vorgelesen, wenn Benachrichtigungen eingehen.",
  it: "La guida vocale funziona. Sentirai i promemoria letti ad alta voce quando arriveranno le notifiche.",
  pt: "A orientação por voz está funcionando. Você ouvirá os lembretes lidos em voz alta quando as notificações chegarem.",
  ja: "音声案内が動作しています。通知が届くと、リマインダーが読み上げられます。",
  ko: "음성 안내가 작동하고 있습니다. 알림이 도착하면 미리 알림을 소리 내어 읽어 드립니다.",
  hi: "वॉइस गाइडेंस काम कर रहा है। जब सूचनाएं आएंगी तो आप रिमाइंडर को ज़ोर से पढ़ा हुआ सुनेंगे।",
};

// Cache the best available voice per language so we don't re-scan every call
const voiceCache: Partial<Record<Language, Speech.Voice | null>> = {};

let audioModeConfigured = false;

async function ensureAudibleMode(): Promise<void> {
  if (audioModeConfigured) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      allowsRecordingIOS: false,
    });
    audioModeConfigured = true;
  } catch (error) {
    logger.error("Failed to configure audio mode for speech:", error);
  }
}

export function getVoiceTestMessage(language: Language): string {
  return VOICE_TEST_MESSAGE[language] ?? VOICE_TEST_MESSAGE.en;
}

export function getLocaleForLanguage(language: Language): string {
  return LANGUAGE_TO_LOCALE[language] ?? "en-US";
}

async function getBestVoice(language: Language): Promise<Speech.Voice | null> {
  if (language in voiceCache) return voiceCache[language] ?? null;

  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const targetLocale = getLocaleForLanguage(language);
    const languagePrefix = language;

    // Prefer an exact-locale enhanced/premium voice, then any exact-locale voice,
    // then any voice whose language starts with the language prefix
    const exactEnhanced = voices.find(
      (v) =>
        v.language === targetLocale &&
        (v.quality === Speech.VoiceQuality.Enhanced || v.identifier.includes("premium") || v.identifier.includes("enhanced"))
    );
    if (exactEnhanced) {
      voiceCache[language] = exactEnhanced;
      return exactEnhanced;
    }

    const exact = voices.find((v) => v.language === targetLocale);
    if (exact) {
      voiceCache[language] = exact;
      return exact;
    }

    const prefixed = voices.find((v) => v.language?.toLowerCase().startsWith(languagePrefix));
    if (prefixed) {
      voiceCache[language] = prefixed;
      return prefixed;
    }

    voiceCache[language] = null;
    return null;
  } catch (error) {
    logger.error("Error finding voice:", error);
    return null;
  }
}

/**
 * Speak text aloud using the device's text-to-speech engine.
 * The language is chosen by the app's selected language so users who set
 * a non-English language in the app (or whose phone is set to another
 * language) hear speech in their chosen tongue.
 */
export async function speak(
  text: string,
  options?: {
    language?: Language;
    pitch?: number;
    rate?: number;
    onDone?: () => void;
    onError?: (error: Error) => void;
  }
): Promise<void> {
  try {
    Speech.stop();
    await ensureAudibleMode();

    const language: Language = options?.language ?? "en";
    const targetLocale = getLocaleForLanguage(language);
    const voice = await getBestVoice(language);

    let callbackFired = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const fireCallback = (type: "done" | "error", error?: Error) => {
      if (callbackFired) return;
      callbackFired = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (type === "done") {
        options?.onDone?.();
      } else if (error) {
        options?.onError?.(error);
      }
    };

    const speechOptions: Speech.SpeechOptions = {
      language: targetLocale,
      pitch: options?.pitch ?? 1.0,
      rate: options?.rate ?? 0.9,
      volume: 1.0,
      onDone: () => fireCallback("done"),
      onStopped: () => fireCallback("done"),
      onError: (error) => {
        logger.error("Speech error:", error);
        fireCallback("error", error as Error);
      },
    };

    if (voice) {
      speechOptions.voice = voice.identifier;
    }

    Speech.speak(text, speechOptions);

    // Android TTS engines can fail silently — fire onDone after timeout as fallback
    if (options?.onDone || options?.onError) {
      timeoutId = setTimeout(() => {
        if (!callbackFired) {
          logger.log(`[Speech] TTS callback timeout after ${TTS_TIMEOUT_MS}ms (${Platform.OS})`);
          fireCallback("done");
        }
      }, TTS_TIMEOUT_MS);
    }
  } catch (error) {
    logger.error("Error speaking text:", error);
    options?.onError?.(error as Error);
  }
}

export function stopSpeaking(): void {
  try {
    Speech.stop();
  } catch (error) {
    logger.error("Error stopping speech:", error);
  }
}

export async function isSpeaking(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync();
  } catch (error) {
    logger.error("Error checking if speaking:", error);
    return false;
  }
}

export async function getAvailableVoices(): Promise<Speech.Voice[]> {
  try {
    return await Speech.getAvailableVoicesAsync();
  } catch (error) {
    logger.error("Error getting available voices:", error);
    return [];
  }
}
