export type AdhanPrayerKey =
  | "Fajr"
  | "Dhuhr"
  | "Asr"
  | "Maghrib"
  | "Isha";

const STORAGE_KEY = "reston-prayer-times:played-adhan";

function getDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

type HistoryData = Record<string, AdhanPrayerKey[]>;

function readHistory(): HistoryData {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

function writeHistory(history: HistoryData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export const prayerHistory = {
  hasPlayed(prayer: AdhanPrayerKey, date = new Date()) {
    const history = readHistory();
    return history[getDateKey(date)]?.includes(prayer) ?? false;
  },

  markPlayed(prayer: AdhanPrayerKey, date = new Date()) {
    const history = readHistory();
    const dateKey = getDateKey(date);
    const prayers = new Set(history[dateKey] ?? []);

    prayers.add(prayer);

    // Only keep the latest seven days.
    const trimmedEntries = Object.entries(history)
      .sort(([left], [right]) => right.localeCompare(left))
      .slice(0, 6);

    writeHistory({
      ...Object.fromEntries(trimmedEntries),
      [dateKey]: Array.from(prayers),
    });
  },
};
