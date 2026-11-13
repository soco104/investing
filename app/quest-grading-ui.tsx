"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { statusLabels, type RuleScore, type StudentGradeReport, type StudentStatus } from "@/lib/quest-grading";

// v0.2.15: grading quest submissions. GradePanel is the teacher/admin grading
// form. StudentGradeReportCard is the separate, read-only report a student
// gets once their grade is released.

export type TeacherGrade = {
  answerChanged: boolean;
  feedback: string;
  gradedAt: string;
  gradedBy: string;
  maxPoints: number;
  releasedAt: string | null;
  scores: RuleScore[];
  status: "draft" | "released";
  totalPoints: number;
};

type Criterion = { id: string; label: string; points: number };

async function postGrade(body: Record<string, unknown>) {
  const response = await fetch("/api/quests/grades", {
    body: JSON.stringify(body),
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const result = (await response.json().catch(() => ({}))) as { message?: string } & Record<string, unknown>;

  if (!response.ok) throw new Error(result.message ?? "That didn't work. Please try again.");
  return result;
}

export function StatusBadge({ status }: { status: StudentStatus }) {
  const tone =
    status === "released"
      ? "bg-[#e8f0ed] text-[#24493f]"
      : status === "graded"
        ? "bg-[#fff3da] text-[#7a4b00]"
        : "";

  return (
    <Badge variant="outline" className={`rounded-md ${tone}`} data-testid="grade-status">
      {statusLabels[status]}
    </Badge>
  );
}

export function GradePanel({
  assignmentId,
  beforeDue,
  criteria,
  grade,
  hasSubmission,
  onChanged,
  studentEmail,
  studentName,
}: {
  assignmentId: string;
  beforeDue: boolean;
  criteria: Criterion[];
  grade: TeacherGrade | null;
  hasSubmission: boolean;
  onChanged: () => void;
  studentEmail: string;
  studentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [points, setPoints] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");
  const [confirmEarly, setConfirmEarly] = useState(false);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  function openForm() {
    // Start from the saved grade, matched to the quest's current rules.
    const saved = new Map(grade?.scores.map((score) => [score.id, score.points]));

    setPoints(Object.fromEntries(criteria.map((rule) => [rule.id, saved.has(rule.id) ? String(saved.get(rule.id)) : ""])));
    setFeedback(grade?.feedback ?? "");
    setConfirmEarly(false);
    setNotice("");
    setOpen(true);
  }

  async function run(body: Record<string, unknown>, success: string, close: boolean) {
    setPending(true);
    setNotice("");
    try {
      await postGrade({ assignmentId, studentEmail, ...body });
      setNotice(success);
      if (close) setOpen(false);
      onChanged();
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setPending(false);
    }
  }

  const total = criteria.reduce((sum, rule) => sum + (Number(points[rule.id]) || 0), 0);
  const max = criteria.reduce((sum, rule) => sum + rule.points, 0);
  const name = studentName || studentEmail;

  return (
    <section aria-label={`Grade for ${name}`} className="mt-3 rounded-md border border-border bg-background p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm">
          <span className="font-semibold">Grade: </span>
          {grade ? (
            <span data-testid="grade-total">
              {grade.maxPoints > 0 ? `${grade.totalPoints} of ${grade.maxPoints} points` : "Feedback only"}
              <span className="text-muted-foreground">
                {" "}
                · {grade.status === "released" ? "released to the student" : "draft, not visible to the student"}
                {grade.gradedBy ? ` · by ${grade.gradedBy}` : ""}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Not graded yet</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {grade?.status === "draft" ? (
            <Button
              type="button"
              size="sm"
              disabled={pending}
              className="bg-[#28666e] text-white hover:bg-[#22565d]"
              onClick={() => void run({ action: "release" }, `Released. ${name} can see this grade now.`, false)}
            >
              Release grade
            </Button>
          ) : null}
          {!open ? (
            <Button type="button" size="sm" variant="outline" onClick={openForm}>
              {grade ? "Change grade" : hasSubmission ? "Grade" : "Enter a grade"}
            </Button>
          ) : null}
        </div>
      </div>

      {grade?.answerChanged ? (
        <p className="mt-2 rounded-md bg-[#fff3da] px-3 py-2 text-sm text-[#7a4b00]" data-testid="answer-changed">
          Answer changed since grading. Check the answer above and change the grade if needed.
        </p>
      ) : null}
      {grade?.feedback && !open ? <p className="mt-2 text-sm text-muted-foreground">Feedback: {grade.feedback}</p> : null}

      {open ? (
        <div className="mt-3 space-y-3">
          {!hasSubmission ? (
            <p className="text-sm text-muted-foreground">
              {`${name} hasn't submitted. You can still record a grade, such as zeros.`}
            </p>
          ) : null}
          {criteria.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This quest has no scoring rules, so the grade is feedback only.
            </p>
          ) : null}
          {criteria.map((rule) => (
            <div key={rule.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <Label htmlFor={`points-${assignmentId}-${studentEmail}-${rule.id}`}>{rule.label}</Label>
              <div className="flex items-center gap-2 text-sm">
                <Input
                  id={`points-${assignmentId}-${studentEmail}-${rule.id}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={rule.points}
                  step={1}
                  className="w-20"
                  value={points[rule.id] ?? ""}
                  onChange={(event) => setPoints((current) => ({ ...current, [rule.id]: event.target.value }))}
                />
                <span className="text-muted-foreground">of {rule.points}</span>
              </div>
            </div>
          ))}
          {criteria.length > 0 ? (
            <p className="text-sm font-medium" data-testid="grade-form-total">
              Total: {total} of {max} points
            </p>
          ) : null}
          <div className="space-y-1">
            <Label htmlFor={`feedback-${assignmentId}-${studentEmail}`}>Feedback for the student (optional)</Label>
            <Textarea
              id={`feedback-${assignmentId}-${studentEmail}`}
              rows={3}
              maxLength={2000}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
            />
          </div>
          {beforeDue ? (
            <label className="flex items-start gap-2 rounded-md bg-[#fff3da] px-3 py-2 text-sm text-[#7a4b00]">
              <input type="checkbox" className="mt-1" checked={confirmEarly} onChange={(event) => setConfirmEarly(event.target.checked)} />
              <span>
                Grade before the due date. The student can still change their answer until then; the grade will be
                marked if they do.
              </span>
            </label>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={pending || (beforeDue && !confirmEarly)}
              onClick={() =>
                void run(
                  { action: "save", confirmEarly, feedback, scores: points },
                  grade?.status === "released"
                    ? `Grade changed. ${name} sees the new grade.`
                    : "Grade saved as a draft. Release it when you want the student to see it.",
                  true
                )
              }
            >
              {grade ? "Save changes" : "Save grade"}
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
      {notice ? (
        <p role="status" className="mt-2 rounded-md bg-accent px-3 py-2 text-sm">
          {notice}
        </p>
      ) : null}
    </section>
  );
}

/** "Release all graded" for one class, with the class's grading summary. */
export function ClassGradeSummary({
  assignmentId,
  averagePercent,
  className,
  draftCount,
  onChanged,
}: {
  assignmentId: string;
  averagePercent: number | null;
  className: string;
  draftCount: number;
  onChanged: () => void;
}) {
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function releaseAll() {
    setPending(true);
    setNotice("");
    try {
      const result = await postGrade({ action: "releaseAll", assignmentId });
      setNotice(`Released ${String(result.released)} grade${result.released === 1 ? "" : "s"} for ${className}.`);
      onChanged();
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm" data-testid="class-grade-summary">
      <span className="text-muted-foreground">
        Class average: {averagePercent === null ? "no grades yet" : `${averagePercent}%`}
      </span>
      {draftCount > 0 ? (
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => void releaseAll()}>
          Release all graded ({draftCount})
        </Button>
      ) : null}
      {notice ? <span role="status">{notice}</span> : null}
    </div>
  );
}

/** What a student sees once their grade is released. Read-only. */
export function StudentGradeReportCard({ report }: { report: StudentGradeReport }) {
  return (
    <section aria-label="Your grade" className="rounded-md border border-[#28666e]/30 bg-[#e8f0ed] p-3" data-testid="grade-report">
      <h4 className="font-semibold">Your grade</h4>
      {report.totalPoints !== null && report.maxPoints !== null && report.maxPoints > 0 ? (
        <p className="mt-1 text-lg font-semibold">
          {report.totalPoints} of {report.maxPoints} points
        </p>
      ) : (
        <p className="mt-1 text-sm">Your teacher has graded this quest.</p>
      )}
      {report.rules.length ? (
        <ul className="mt-2 grid gap-1 text-sm">
          {report.rules.map((rule) => (
            <li key={rule.label} className="flex justify-between gap-3">
              <span>{rule.label}</span>
              <span className="font-medium">
                {rule.points} of {rule.max}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {report.feedback ? (
        <div className="mt-2 text-sm">
          <p className="font-medium">Feedback from your teacher</p>
          <p className="mt-1 whitespace-pre-wrap">{report.feedback}</p>
        </div>
      ) : null}
    </section>
  );
}
