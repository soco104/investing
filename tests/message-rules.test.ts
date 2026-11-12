import { describe, expect, it } from "vitest";

import {
  canMessage,
  filterMessage,
  isAllowedEmailDomain,
  isExpired,
  isValidEmail,
  normalizeDomain,
  type Person,
} from "@/lib/message-rules";

const studentA: Person = { classNames: ["7th A"], role: "Student" };
const studentA2: Person = { classNames: ["7th A", "Lab"], role: "Student" };
const studentB: Person = { classNames: ["7th B"], role: "Student" };
const teacherA: Person = { classNames: ["7th A", "7th B"], role: "Teacher" };
const teacherC: Person = { classNames: ["Lab"], role: "Teacher" };
const admin: Person = { classNames: [], role: "Admin" };

describe("canMessage", () => {
  it("students: classmates and their teachers only", () => {
    expect(canMessage(studentA, studentA2)).toBe(true);
    expect(canMessage(studentA, teacherA)).toBe(true);
    expect(canMessage(studentA, studentB)).toBe(false);
    expect(canMessage(studentA, teacherC)).toBe(false);
    expect(canMessage(studentA, admin)).toBe(false);
  });

  it("teachers: students in their classes, other teachers, and admins", () => {
    expect(canMessage(teacherA, studentA)).toBe(true);
    expect(canMessage(teacherA, studentB)).toBe(true);
    expect(canMessage(teacherC, studentA)).toBe(false);
    expect(canMessage(teacherC, studentA2)).toBe(true);
    expect(canMessage(teacherA, teacherC)).toBe(true);
    expect(canMessage(teacherA, admin)).toBe(true);
  });

  it("admins: everyone", () => {
    expect(canMessage(admin, studentA)).toBe(true);
    expect(canMessage(admin, teacherC)).toBe(true);
    expect(canMessage(admin, admin)).toBe(true);
  });
});

describe("isExpired", () => {
  const now = new Date("2026-12-01T12:00:00Z");
  const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000);

  it("expires after 90 days unless someone kept it", () => {
    expect(isExpired(daysAgo(89), false, now)).toBe(false);
    expect(isExpired(daysAgo(91), false, now)).toBe(true);
    expect(isExpired(daysAgo(400), true, now)).toBe(false);
  });
});

describe("filterMessage", () => {
  it("allows normal classroom messages, including words that contain short bad words", () => {
    for (const text of [
      "I put 20% in savings first.",
      "Can you help with the class assignment?",
      "Hello! The shell company example was hard.",
      "Scunthorpe, Dickens and the classic bass guitar",
      "My assets grew by 4%.",
    ]) {
      expect(filterMessage(text).status).toBe("allowed");
    }
  });

  it("blocks bad words, including disguised ones", () => {
    for (const text of [
      "this is shit",
      "what the f u c k",
      "sh1t happens",
      "fuuuuck that",
      "you are an a$$hole",
      "BULLSHIT",
      "damn it",
      "f.u.c.k",
    ]) {
      expect(filterMessage(text).status, text).toBe("blocked");
    }
  });

  it("sends but flags personal info, safety concerns and bullying for review", () => {
    expect(filterMessage("call me at 610-555-0142")).toMatchObject({
      reasons: ["Possible phone number"],
      status: "review",
    });
    expect(filterMessage("email me maya@example.com")).toMatchObject({ status: "review" });
    expect(filterMessage("I live at 42 Maple Street")).toMatchObject({ status: "review" });
    expect(filterMessage("add me on snap")).toMatchObject({ status: "review" });
    expect(filterMessage("I want to die")).toMatchObject({ reasons: ["Possible safety concern"] });
    expect(filterMessage("you are worthless")).toMatchObject({ reasons: ["Possible bullying"] });
  });

  it("blocked wins over review", () => {
    expect(filterMessage("shit call 610-555-0142").status).toBe("blocked");
  });
});

describe("email domains", () => {
  it("validates addresses and normalizes domains", () => {
    expect(isValidEmail("parent@example.com")).toBe(true);
    expect(isValidEmail("nope")).toBe(false);
    expect(isValidEmail("a b@example.com")).toBe(false);
    expect(normalizeDomain("  @District.ORG ")).toBe("district.org");
    expect(normalizeDomain("https://mail.district.org/path")).toBe("mail.district.org");
    expect(normalizeDomain("not a domain")).toBeNull();
    expect(normalizeDomain("localhost")).toBeNull();
  });

  it("allows listed domains and their subdomains, not look-alikes", () => {
    const allowed = ["district.org"];
    expect(isAllowedEmailDomain("a@district.org", allowed)).toBe(true);
    expect(isAllowedEmailDomain("A@Mail.District.org", allowed)).toBe(true);
    expect(isAllowedEmailDomain("a@evildistrict.org", allowed)).toBe(false);
    expect(isAllowedEmailDomain("a@district.org.evil.com", allowed)).toBe(false);
    expect(isAllowedEmailDomain("a@district.org", [])).toBe(false);
    expect(isAllowedEmailDomain("bad", allowed)).toBe(false);
  });
});
