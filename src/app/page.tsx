"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePrayerEngine } from "../hooks/usePrayerEngine";

type PrayerKey =
  | "Fajr"
  | "Sunrise"
  | "Dhuhr"
  | "Asr"
  | "Maghrib"
  | "Isha";

type PrayerResponse = {
  timings: Record<PrayerKey, string>;
  readableDate: string;
  hijriDate: string;
  timezone: string;
  method: string;
  location: string;
};

const prayers: Array<{
  key: PrayerKey;
  label: string;
  icon: string;
}> = [
  { key: "Fajr", label: "İmsak", icon: "☾" },
  { key: "Sunrise", label: "Güneş", icon: "☀" },
  { key: "Dhuhr", label: "Öğle", icon: "◉" },
  { key: "Asr", label: "İkindi", icon: "◒" },
  { key: "Maghrib", label: "Akşam", icon: "◐" },
  { key: "Isha", label: "Yatsı", icon: "✦" },
];

const prayerLabels: Record<string, string> = {
  Fajr: "İmsak",
  Dhuhr: "Öğle",
  Asr: "İkindi",
  Maghrib: "Akşam",
  Isha: "Yatsı",
};

function getRestonDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function parseTodayTime(value: string) {
  const clean = value.replace(/\s*\(.+\)\s*$/, "").trim();
  const [hours, minutes] = clean.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatTime(value: string | Date) {
  const date = typeof value === "string" ? parseTodayTime(value) : value;

  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours === 0 && minutes === 0) {
    return `${seconds} saniye kaldı`;
  }

  if (hours === 0) {
    return `${minutes} dakika ${seconds} saniye kaldı`;
  }

  return `${hours} saat ${minutes} dakika ${seconds} saniye kaldı`;
}

export default function Home() {
  const [data, setData] = useState<PrayerResponse | null>(null);
  const [now, setNow] = useState(new Date());
  const [error, setError] = useState("");
  const dateKeyRef = useRef(getRestonDateKey());

  const loadPrayerTimes = useCallback(async () => {
    try {
      const response = await fetch("/api/prayer-times", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Namaz vakitleri yüklenemedi.");
      }

      setData(await response.json());
      setError("");
    } catch {
      setError(
        "Namaz vakitleri yüklenemedi. Lütfen internet bağlantısını kontrol edin."
      );
    }
  }, []);

  useEffect(() => {
    void loadPrayerTimes();

    const clock = window.setInterval(() => {
      const currentTime = new Date();
      const currentDateKey = getRestonDateKey(currentTime);

      setNow(currentTime);

      if (currentDateKey !== dateKeyRef.current) {
        dateKeyRef.current = currentDateKey;
        void loadPrayerTimes();
      }
    }, 1000);

    return () => window.clearInterval(clock);
  }, [loadPrayerTimes]);

  const engine = usePrayerEngine(data?.timings ?? null);

  const nextPrayer = useMemo(() => {
    if (!data) return null;

    const prayerOnly = prayers.filter(
      (prayer) => prayer.key !== "Sunrise"
    );

    const upcoming = prayerOnly.find(
      (prayer) =>
        parseTodayTime(data.timings[prayer.key]).getTime() >
        now.getTime()
    );

    if (upcoming) {
      const time = parseTodayTime(data.timings[upcoming.key]);

      return {
        ...upcoming,
        time,
        countdown: formatCountdown(
          time.getTime() - now.getTime()
        ),
      };
    }

    const fajrTomorrow = parseTodayTime(data.timings.Fajr);
    fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);

    return {
      key: "Fajr" as PrayerKey,
      label: "İmsak",
      icon: "☾",
      time: fajrTomorrow,
      countdown: formatCountdown(
        fajrTomorrow.getTime() - now.getTime()
      ),
    };
  }, [data, now]);

  if (error) {
    return (
      <main className="screen-center">
        <section className="status-card">
          <strong>Bir sorun oluştu</strong>
          <span>{error}</span>
        </section>
      </main>
    );
  }

  if (!data || !nextPrayer) {
    return (
      <main className="screen-center">
        <section className="status-card">
          <div className="loader" />
          <span>Bugünün namaz vakitleri yükleniyor…</span>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      {engine.status === "locked" && (
        <section className="audio-overlay">
          <div className="audio-dialog">
            <span className="audio-symbol">◖))</span>
            <h2>Ezan sesini etkinleştir</h2>
            <p>
              Otomatik ezan için ilk açılışta bir kez dokunmanızı
              gerektirir. Uygulama açık kaldığı sürece ezan vakitlerinde
              otomatik çalacaktır.
            </p>
            <button type="button" onClick={engine.unlock}>
              Ezanı etkinleştir
            </button>
          </div>
        </section>
      )}

      <section className="dashboard">
        <header className="topbar">
          <div className="location-block">
            <div className="location-pin" aria-hidden="true">
              ●
            </div>
            <div>
              <p className="eyebrow">Reston Namaz Vakitleri</p>
              <h1>Reston, Virginia</h1>
              <p className="subtle">
                20191 · Doğu Amerika Saati
              </p>
            </div>
          </div>

          <div className="brand-mark" aria-hidden="true">
            الله
          </div>

          <div className="clock-block">
            <time>{formatTime(now)}</time>
            <span>{data.readableDate}</span>
          </div>
        </header>

        <section className="next-card">
          <div className="stars" aria-hidden="true">
            ✦　·　✧
          </div>
          <p className="next-label">Sıradaki vakit</p>
          <h2>{nextPrayer.label}</h2>
          <div className="next-time">
            {formatTime(nextPrayer.time)}
          </div>
          <div className="countdown">
            <span className="countdown-icon">◷</span>
            {nextPrayer.countdown}
          </div>

          <div className="mosque-scene" aria-hidden="true">
            <div className="minaret minaret-left">
              <i />
            </div>
            <div className="mosque-dome">
              <i />
            </div>
            <div className="minaret minaret-right">
              <i />
            </div>
            <div className="mosque-base">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </section>

        <section
          className="prayer-panel"
          aria-label="Bugünün namaz vakitleri"
        >
          {prayers.map((prayer) => {
            const active = prayer.key === nextPrayer.key;

            return (
              <article
                key={prayer.key}
                className={`prayer-row ${
                  active ? "active" : ""
                }`}
              >
                <div className="prayer-info">
                  <span
                    className="prayer-icon"
                    aria-hidden="true"
                  >
                    {prayer.icon}
                  </span>
                  <div>
                    <strong>{prayer.label}</strong>
                    {active && <small>Sıradaki vakit</small>}
                  </div>
                </div>
                <time>
                  {formatTime(data.timings[prayer.key])}
                </time>
              </article>
            );
          })}
        </section>

        <footer className="bottom-bar">
          <div className="date-item">
            <span className="footer-icon">▣</span>
            <div>
              <small>Bugün</small>
              <strong>{data.readableDate}</strong>
            </div>
          </div>

          <div className="engine-state">
            <span
              className={`engine-dot ${engine.status}`}
            />
            <span>
              {engine.status === "playing" && engine.activePrayer
                ? `${prayerLabels[engine.activePrayer]} ezanı okunuyor`
                : engine.status === "error"
                  ? engine.error
                  : "Ezan sistemi hazır"}
            </span>
          </div>

          <div className="date-item">
            <span className="footer-icon">☾</span>
            <div>
              <small>Hicri Tarih</small>
              <strong>{data.hijriDate}</strong>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
