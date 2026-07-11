import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const LATITUDE = 38.9339;
const LONGITUDE = -77.3575;
const METHOD = 2; // Islamic Society of North America (ISNA)

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

    const url = new URL(
      `https://api.aladhan.com/v1/timings/${apiDate}`
    );
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

    const { timings, date: prayerDate, meta } = payload.data;

    return NextResponse.json({
      timings: {
        Fajr: timings.Fajr,
        Sunrise: timings.Sunrise,
        Dhuhr: timings.Dhuhr,
        Asr: timings.Asr,
        Maghrib: timings.Maghrib,
        Isha: timings.Isha,
      },
      readableDate: prayerDate.readable,
      hijriDate: `${prayerDate.hijri.day} ${prayerDate.hijri.month.en} ${prayerDate.hijri.year}`,
      timezone: meta.timezone,
      method: meta.method?.name ?? "ISNA",
      location: "Reston, Virginia 20191",
    });
  } catch (error) {
    console.error("Prayer times error:", error);

    return NextResponse.json(
      { message: "Prayer times could not be loaded." },
      { status: 500 }
    );
  }
}
