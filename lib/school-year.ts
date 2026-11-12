/**
 * School years. Each district sets the first and last day of its school year
 * (month and day, e.g. "08-28" and "06-01"); the default is Aug 28 – Jun 1.
 *
 * - A date belongs to the school year that contains it.
 * - Summer dates (after the last day, before the next first day) belong to
 *   the UPCOMING school year, so summer setup lands in the right year.
 * - A school year has ended once its last day has passed. Class portfolios
 *   from ended years are read-only records.
 *
 * Labels look like "2026-27". If a district's year runs within one calendar
 * year (first day before last day, e.g. "01-15" to "11-30"), the label is just
 * the year, e.g. "2026".
 */

export type SchoolYearSettings = {
  end: string; // "MM-DD", last day
  start: string; // "MM-DD", first day
};

export const DEFAULT_SCHOOL_YEAR: SchoolYearSettings = { end: "06-01", start: "08-28" };

export function isValidMonthDay(value: string) {
  const match = /^(\d{2})-(\d{2})$/.exec(value);

  if (!match) return false;

  const month = Number(match[1]);
  const day = Number(match[2]);
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1];
}

function monthDayValue(value: string) {
  const [month, day] = value.split("-").map(Number);
  return month * 100 + day;
}

function dateValue(date: Date) {
  // Calendar date in UTC, so results don't depend on the server's time zone.
  return (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
}

function twoDigits(year: number) {
  return String(year % 100).padStart(2, "0");
}

export type SchoolYear = {
  endYear: number;
  label: string;
  startYear: number;
};

export function schoolYearFor(
  date: Date,
  settings: SchoolYearSettings = DEFAULT_SCHOOL_YEAR
): SchoolYear {
  const year = date.getUTCFullYear();
  const today = dateValue(date);
  const start = monthDayValue(settings.start);
  const end = monthDayValue(settings.end);

  if (start <= end) {
    // Year runs within one calendar year. Dates after the last day belong to
    // next year's school year.
    const startYear = today > end ? year + 1 : year;
    return { endYear: startYear, label: String(startYear), startYear };
  }

  // Year spans New Year (the usual case). Before or on the last day: the
  // year that started last calendar year. Otherwise (school year or summer):
  // the year starting this calendar year.
  const startYear = today <= end ? year - 1 : year;
  return {
    endYear: startYear + 1,
    label: `${startYear}-${twoDigits(startYear + 1)}`,
    startYear,
  };
}

/** True once the last day of the labeled school year has passed. */
export function hasSchoolYearEnded(
  label: string,
  now: Date = new Date(),
  settings: SchoolYearSettings = DEFAULT_SCHOOL_YEAR
) {
  const startYear = Number(label.slice(0, 4));

  if (!Number.isFinite(startYear)) return false;

  const spansNewYear = monthDayValue(settings.start) > monthDayValue(settings.end);
  const endYear = spansNewYear ? startYear + 1 : startYear;
  const [month, day] = settings.end.split("-").map(Number);
  const lastDayEnds = Date.UTC(endYear, month - 1, day + 1); // midnight after

  return now.getTime() >= lastDayEnds;
}

export function formatSchoolYear(label: string) {
  return label.replace("-", "–");
}
