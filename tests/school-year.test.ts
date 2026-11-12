import { describe, expect, it } from "vitest";

import {
  DEFAULT_SCHOOL_YEAR,
  hasSchoolYearEnded,
  isValidMonthDay,
  schoolYearFor,
} from "@/lib/school-year";

const day = (iso: string) => new Date(`${iso}T12:00:00Z`);

describe("school years (default Aug 28 – Jun 1)", () => {
  it("labels dates during the school year", () => {
    expect(schoolYearFor(day("2026-08-28")).label).toBe("2026-27");
    expect(schoolYearFor(day("2026-09-03")).label).toBe("2026-27");
    expect(schoolYearFor(day("2027-01-15")).label).toBe("2026-27");
    expect(schoolYearFor(day("2027-06-01")).label).toBe("2026-27");
  });

  it("puts summer dates in the upcoming school year", () => {
    expect(schoolYearFor(day("2027-06-02")).label).toBe("2027-28");
    expect(schoolYearFor(day("2027-08-27")).label).toBe("2027-28");
  });

  it("says when a school year has ended (after its last day)", () => {
    expect(hasSchoolYearEnded("2026-27", day("2027-06-01"))).toBe(false);
    expect(hasSchoolYearEnded("2026-27", new Date("2027-06-02T00:00:00Z"))).toBe(true);
    expect(hasSchoolYearEnded("2025-26", day("2026-11-12"))).toBe(true);
    expect(hasSchoolYearEnded("2026-27", day("2026-11-12"))).toBe(false);
  });

  it("supports other district calendars", () => {
    const early = { end: "05-20", start: "08-05" };
    expect(schoolYearFor(day("2026-08-05"), early).label).toBe("2026-27");
    expect(schoolYearFor(day("2026-05-25"), early).label).toBe("2026-27");
    expect(hasSchoolYearEnded("2025-26", day("2026-05-21"), early)).toBe(true);

    const calendarYear = { end: "11-30", start: "01-15" };
    expect(schoolYearFor(day("2026-03-01"), calendarYear).label).toBe("2026");
    expect(schoolYearFor(day("2026-12-10"), calendarYear).label).toBe("2027");
    expect(hasSchoolYearEnded("2026", day("2026-12-01"), calendarYear)).toBe(true);
  });

  it("validates month-day settings", () => {
    expect(isValidMonthDay(DEFAULT_SCHOOL_YEAR.start)).toBe(true);
    expect(isValidMonthDay("02-29")).toBe(true);
    expect(isValidMonthDay("02-30")).toBe(false);
    expect(isValidMonthDay("13-01")).toBe(false);
    expect(isValidMonthDay("8-28")).toBe(false);
  });
});
