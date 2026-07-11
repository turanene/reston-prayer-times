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
  { key: "Fajr", label: "İmsak", icon: "☾" },
  { key: "Sunrise", label: "Güneş", icon: "☀" },
  { key: "Dhuhr", label: "Öğle", icon: "◉" },
  { key: "Asr", label: "İkindi", icon: "◒" },
  { key: "Maghrib", label: "Akşam", icon: "◐" },
  { key: "Isha", label: "Yatsı", icon: "✦" },
];

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
  const totalMinutes = Math.max(0, Math.floor(milliseconds / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} dakika`;
  if (minutes === 0) return `${hours} saat`;
  return `${hours} saat ${minutes} dakika`;
}

export default function Home() {
  const [data, setData] = useState<PrayerResponse | null>(null);
  const [now, setNow] = useState(new Date());
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPrayerTimes() {
      try {
        const response = await fetch("/api/prayer-times", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Namaz vakitleri yüklenemedi.");
        }

        setData(await response.json());
      } catch {
        setError("Namaz vakitleri yüklenemedi. Lütfen tekrar deneyin.");
      }
    }

    loadPrayerTimes();

    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  const nextPrayer = useMemo(() => {
    if (!data) return null;

    const prayerOnly = prayers.filter((prayer) => prayer.key !== "Sunrise");

    const upcoming = prayerOnly.find(
      (prayer) =>
        parseTodayTime(data.timings[prayer.key]).getTime() > now.getTime()
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
      label: "İmsak",
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
            <p className="eyebrow">Namaz Vakitleri</p>
            <h1>Reston, Virginia</h1>
            <p className="location">20191 · Doğu Amerika Saati</p>
          </div>

          <div className="live-time" aria-label="Şu anki saat">
            {formatTime(now)}
          </div>
        </header>

        {error ? (
          <div className="message error-message">
            <strong>Bir sorun oluştu</strong>
            <span>{error}</span>
          </div>
        ) : !data || !nextPrayer ? (
          <div className="message">
            <div className="loader" aria-hidden="true" />
            <span>Bugünün namaz vakitleri yükleniyor…</span>
          </div>
        ) : (
          <>
            <section className="hero">
              <div className="hero-copy">
                <p className="hero-label">Sıradaki vakit</p>
                <h2>{nextPrayer.label}</h2>
                <p className="hero-time">{formatTime(nextPrayer.time)}</p>

                <div className="countdown">
                  <span className="pulse" />
                  {nextPrayer.countdown} kaldı
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
                <span>Bugün</span>
                <strong>{data.readableDate}</strong>
              </div>

              <div className="hijri">
                <span>Hicri Tarih</span>
                <strong>{data.hijriDate}</strong>
              </div>
            </section>

            <section className="prayer-list" aria-label="Bugünün namaz vakitleri">
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
                        {active && <small>Sıradaki vakit</small>}
                      </div>
                    </div>

                    <time>{formatTime(data.timings[prayer.key])}</time>
                  </article>
                );
              })}
            </section>

            <footer>
              <p>Hesaplama yöntemi: {data.method}</p>
              <p>
                Namaz vakitleri hesaplamaya dayalı tahmini değerlerdir. Yerel
                caminizin vakitleri farklıysa caminizin takvimini esas alın.
              </p>
            </footer>
          </>
        )}
      </section>
    </main>
  );
}
