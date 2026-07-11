import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const LATITUDE = 38.9339;
const LONGITUDE = -77.3575;
const METHOD = 2; // Islamic Society of North America (ISNA)

const hijriMonths: Record<string, string> = {
  Muharram: "Muharrem",
  Safar: "Safer",
  "Rabi’ al-awwal": "Rebiülevvel",
  "Rabi’ al-thani": "Rebiülahir",
  "Jumada al-awwal": "Cemaziyelevvel",
  "Jumada al-thani": "Cemaziyelahir",
  Rajab: "Recep",
  "Sha’ban": "Şaban",
  Ramadan: "Ramazan",
  Shawwal: "Şevval",
  "Dhu al-Qi’dah": "Zilkade",
  "Dhu al-Hijjah": "Zilhicce",
};

export async function GET() {
  try {
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const [year, month, day] = date.split("-");
    const apiDate = `${day}-${month}-${year}`;

    const url = new URL(`https://api.aladhan.com/v1/timings/${apiDate}`);
    url.searchParams.set("latitude", String(LATITUDE));
    url.searchParams.set("longitude", String(LONGITUDE));
    url.searchParams.set("method", String(METHOD));
    url.searchParams.set("school", "0");

    const response = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Prayer API returned ${response.status}`);
    }

    const payload = await response.json();

    if (payload.code !== 200 || !payload.data?.timings) {
      throw new Error("Prayer API returned an unexpected response");
    }

    const { timings, date: prayerDate } = payload.data;

    const gregorianDate = new Intl.DateTimeFormat("tr-TR", {
      timeZone: "America/New_York",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());

    const hijriMonth =
      hijriMonths[prayerDate.hijri.month.en] ?? prayerDate.hijri.month.en;

    return NextResponse.json({
      timings: {
        Fajr: timings.Fajr,
        Sunrise: timings.Sunrise,
        Dhuhr: timings.Dhuhr,
        Asr: timings.Asr,
        Maghrib: timings.Maghrib,
        Isha: timings.Isha,
      },
      readableDate: gregorianDate,
      hijriDate: `${prayerDate.hijri.day} ${hijriMonth} ${prayerDate.hijri.year}`,
      timezone: "America/New_York",
      method: "Kuzey Amerika İslam Toplumu (ISNA)",
      location: "Reston, Virginia 20191",
    });
  } catch (error) {
    console.error("Namaz vakitleri hatası:", error);

    return NextResponse.json(
      { message: "Namaz vakitleri yüklenemedi." },
      { status: 500 }
    );
  }
}
