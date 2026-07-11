"use client";

import { useEffect, useMemo, useState } from "react";

type PrayerKey = "Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

type PrayerResponse = {
  timings: Record<PrayerKey, string>;
  readableDate: string;
  hijriDate: string;
  timezone: string;
  method: string;
  location: string;
};

const prayers: Array<{ key: PrayerKey; label: string; icon: string }> = [
  { key: "Fajr", label: "Fajr", icon: "☾" },
  { key: "Sunrise", label: "Sunrise", icon: "☀" },
  { key: "Dhuhr", label: "Dhuhr", icon: "◉" },
  { key: "Asr", label: "Asr", icon: "◒" },
  { key: "Maghrib", label: "Maghrib", icon: "◐" },
  { key: "Isha", label: "Isha", icon: "✦" },
];

function parseTodayTime(value: string) {
  const clean = value.replace(/\s*\(.+\)\s*$/, "").trim();
  const [hours, minutes] = clean.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function format12Hour(value: string) {
  const date = parseTodayTime(value);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatCountdown(milliseconds: number) {
  const totalMinutes = Math.max(0, Math.floor(milliseconds / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  return `${hours} hr ${minutes} min`;
}

export default function Home() {
  const [data, setData] = useState<PrayerResponse | null>(null);
  const [now, setNow] = useState(new Date());
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPrayerTimes() {
      try {
        const response = await fetch("/api/prayer-times", { cache: "no-store" });
        if (!response.ok) throw new Error("Prayer times could not be loaded.");
        setData(await response.json());
      } catch {
        setError("Prayer times could not be loaded. Please try again.");
      }
    }

    loadPrayerTimes();
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const nextPrayer = useMemo(() => {
    if (!data) return null;

    const prayerOnly = prayers.filter((prayer) => prayer.key !== "Sunrise");
    const upcoming = prayerOnly.find(
      (prayer) => parseTodayTime(data.timings[prayer.key]).getTime() > now.getTime()
    );

    if (upcoming) {
      const time = parseTodayTime(data.timings[upcoming.key]);
      return {
        ...upcoming,
        time,
        countdown: formatCountdown(time.getTime() - now.getTime()),
      };
    }

    const fajrTomorrow = parseTodayTime(data.timings.Fajr);
    fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);

    return {
      key: "Fajr" as PrayerKey,
      label: "Fajr",
      icon: "☾",
      time: fajrTomorrow,
      countdown: formatCountdown(fajrTomorrow.getTime() - now.getTime()),
    };
  }, [data, now]);

  return (
    <main className="app-shell">
      <section className="phone-card">
        <header className="topbar">
          <div>
            <p className="eyebrow">Prayer Times</p>
            <h1>Reston, Virginia</h1>
            <p className="location">20191 · America/New_York</p>
          </div>
          <div className="live-time" aria-label="Current time">
            {new Intl.DateTimeFormat("en-US", {
              hour: "numeric",
              minute: "2-digit",
            }).format(now)}
          </div>
        </header>

        {error ? (
          <div className="message error-message">
            <strong>Something went wrong</strong>
            <span>{error}</span>
          </div>
        ) : !data || !nextPrayer ? (
          <div className="message">
            <div className="loader" aria-hidden="true" />
            <span>Loading today&apos;s prayer times…</span>
          </div>
        ) : (
          <>
            <section className="hero">
              <div className="hero-copy">
                <p className="hero-label">Next prayer</p>
                <h2>{nextPrayer.label}</h2>
                <p className="hero-time">
                  {new Intl.DateTimeFormat("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(nextPrayer.time)}
                </p>
                <div className="countdown">
                  <span className="pulse" />
                  In {nextPrayer.countdown}
                </div>
              </div>

              <div className="mosque" aria-hidden="true">
                <div className="moon">☾</div>
                <div className="minaret left">
                  <span />
                </div>
                <div className="dome">
                  <span className="finial">◆</span>
                </div>
                <div className="minaret right">
                  <span />
                </div>
                <div className="base">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </section>

            <section className="date-row">
              <div>
                <span>Today</span>
                <strong>{data.readableDate}</strong>
              </div>
              <div className="hijri">
                <span>Hijri</span>
                <strong>{data.hijriDate}</strong>
              </div>
            </section>

            <section className="prayer-list" aria-label="Today's prayer times">
              {prayers.map((prayer) => {
                const active = prayer.key === nextPrayer.key;

                return (
                  <article
                    className={`prayer-row ${active ? "active" : ""}`}
                    key={prayer.key}
                  >
                    <div className="prayer-name">
                      <span className="prayer-icon" aria-hidden="true">
                        {prayer.icon}
                      </span>
                      <div>
                        <strong>{prayer.label}</strong>
                        {active && <small>Next prayer</small>}
                      </div>
                    </div>
                    <time>{format12Hour(data.timings[prayer.key])}</time>
                  </article>
                );
              })}
            </section>

            <footer>
              <p>Calculation method: {data.method}</p>
              <p>
                Prayer times are calculated estimates. Please follow your local
                mosque when its schedule differs.
              </p>
            </footer>
          </>
        )}
      </section>
    </main>
  );
}
