"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { audioEngine } from "../lib/audioEngine";
import {
  AdhanPrayerKey,
  prayerHistory,
} from "../lib/prayerHistory";

type PrayerTimings = Record<
  "Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha",
  string
>;

type EngineStatus = "locked" | "ready" | "playing" | "error";

const AUDIO_SOURCE = "/ezan.mp3";
const GRACE_PERIOD_MS = 5 * 60 * 1000;
const WATCHDOG_INTERVAL_MS = 15 * 1000;

const adhanPrayers: AdhanPrayerKey[] = [
  "Fajr",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
];

function parsePrayerTime(value: string, baseDate = new Date()) {
  const clean = value.replace(/\s*\(.+\)\s*$/, "").trim();
  const [hours, minutes] = clean.split(":").map(Number);

  const result = new Date(baseDate);
  result.setHours(hours, minutes, 0, 0);

  return result;
}

export function usePrayerEngine(timings: PrayerTimings | null) {
  const [status, setStatus] = useState<EngineStatus>("locked");
  const [activePrayer, setActivePrayer] =
    useState<AdhanPrayerKey | null>(null);
  const [error, setError] = useState("");

  const enabledRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const playingRef = useRef(false);

  const clearScheduledTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const playPrayer = useCallback(async (prayer: AdhanPrayerKey) => {
    if (playingRef.current || prayerHistory.hasPlayed(prayer)) return;

    try {
      playingRef.current = true;
      setActivePrayer(prayer);
      setStatus("playing");
      setError("");

      await audioEngine.play(AUDIO_SOURCE);
      prayerHistory.markPlayed(prayer);

      setStatus("ready");
    } catch (playError) {
      console.error(playError);
      setError(
        "Ezan sesi oynatılamadı. iPad sesini ve ezan.mp3 dosyasını kontrol edin."
      );
      setStatus("error");
    } finally {
      playingRef.current = false;
      setActivePrayer(null);
    }
  }, []);

  const checkDuePrayer = useCallback(() => {
    if (!enabledRef.current || !timings || playingRef.current) return;

    const now = new Date();

    for (const prayer of adhanPrayers) {
      if (prayerHistory.hasPlayed(prayer, now)) continue;

      const scheduledTime = parsePrayerTime(timings[prayer], now);
      const elapsed = now.getTime() - scheduledTime.getTime();

      if (elapsed >= 0 && elapsed <= GRACE_PERIOD_MS) {
        void playPrayer(prayer);
        return;
      }
    }
  }, [playPrayer, timings]);

  const scheduleNextPrayer = useCallback(() => {
    clearScheduledTimer();

    if (!enabledRef.current || !timings) return;

    const now = new Date();

    const nextPrayer = adhanPrayers
      .map((prayer) => ({
        prayer,
        time: parsePrayerTime(timings[prayer], now),
      }))
      .filter(({ prayer, time }) => {
        return (
          time.getTime() > now.getTime() &&
          !prayerHistory.hasPlayed(prayer, now)
        );
      })
      .sort((left, right) => left.time.getTime() - right.time.getTime())[0];

    if (!nextPrayer) return;

    const delay = Math.max(
      0,
      nextPrayer.time.getTime() - now.getTime()
    );

    timeoutRef.current = window.setTimeout(() => {
      void playPrayer(nextPrayer.prayer);
      scheduleNextPrayer();
    }, delay);
  }, [clearScheduledTimer, playPrayer, timings]);

  const unlock = useCallback(async () => {
    try {
      setError("");
      await audioEngine.unlock(AUDIO_SOURCE);

      enabledRef.current = true;
      setStatus("ready");

      checkDuePrayer();
      scheduleNextPrayer();
    } catch (unlockError) {
      console.error(unlockError);
      setStatus("error");
      setError(
        "Ezan etkinleştirilemedi. public/ezan.mp3 dosyasını kontrol edin."
      );
    }
  }, [checkDuePrayer, scheduleNextPrayer]);

  useEffect(() => {
    if (!enabledRef.current || !timings) return;

    checkDuePrayer();
    scheduleNextPrayer();

    const watchdog = window.setInterval(
      checkDuePrayer,
      WATCHDOG_INTERVAL_MS
    );

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkDuePrayer();
        scheduleNextPrayer();
      }
    };

    window.addEventListener("focus", checkDuePrayer);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.clearInterval(watchdog);
      clearScheduledTimer();
      window.removeEventListener("focus", checkDuePrayer);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [
    checkDuePrayer,
    clearScheduledTimer,
    scheduleNextPrayer,
    timings,
  ]);

  return {
    status,
    activePrayer,
    error,
    unlock,
  };
}
