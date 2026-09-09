import { relations } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const districts = sqliteTable("districts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  state: text("state").notNull(),
  privacyContactEmail: text("privacy_contact_email").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const schools = sqliteTable("schools", {
  id: text("id").primaryKey(),
  districtId: text("district_id")
    .notNull()
    .references(() => districts.id),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const classrooms = sqliteTable("classrooms", {
  id: text("id").primaryKey(),
  schoolId: text("school_id")
    .notNull()
    .references(() => schools.id),
  teacherUserId: text("teacher_user_id").notNull(),
  name: text("name").notNull(),
  gradeBand: text("grade_band").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const students = sqliteTable("students", {
  id: text("id").primaryKey(),
  classroomId: text("classroom_id")
    .notNull()
    .references(() => classrooms.id),
  displayName: text("display_name").notNull(),
  gradeLevel: integer("grade_level").notNull(),
  readinessScore: integer("readiness_score").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const simulatedPortfolios = sqliteTable("simulated_portfolios", {
  id: text("id").primaryKey(),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id),
  cashCents: integer("cash_cents").notNull().default(0),
  totalValueCents: integer("total_value_cents").notNull().default(0),
  riskLevel: text("risk_level").notNull().default("balanced"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const positions = sqliteTable("positions", {
  id: text("id").primaryKey(),
  portfolioId: text("portfolio_id")
    .notNull()
    .references(() => simulatedPortfolios.id),
  vehicle: text("vehicle").notNull(),
  symbol: text("symbol").notNull(),
  quantity: real("quantity").notNull(),
  averagePriceCents: integer("average_price_cents").notNull(),
});

export const lessons = sqliteTable("lessons", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  concept: text("concept").notNull(),
  gradeBand: text("grade_band").notNull(),
  points: integer("points").notNull(),
});

export const lessonProgress = sqliteTable("lesson_progress", {
  id: text("id").primaryKey(),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lessons.id),
  status: text("status").notNull(),
  masteryScore: integer("mastery_score").notNull().default(0),
  submittedAt: integer("submitted_at", { mode: "timestamp" }),
});

export const districtsRelations = relations(districts, ({ many }) => ({
  schools: many(schools),
}));

export const schoolsRelations = relations(schools, ({ one, many }) => ({
  district: one(districts, {
    fields: [schools.districtId],
    references: [districts.id],
  }),
  classrooms: many(classrooms),
}));

export const classroomsRelations = relations(classrooms, ({ one, many }) => ({
  school: one(schools, {
    fields: [classrooms.schoolId],
    references: [schools.id],
  }),
  students: many(students),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  classroom: one(classrooms, {
    fields: [students.classroomId],
    references: [classrooms.id],
  }),
  portfolios: many(simulatedPortfolios),
  progress: many(lessonProgress),
}));

export const portfolioRelations = relations(
  simulatedPortfolios,
  ({ one, many }) => ({
    student: one(students, {
      fields: [simulatedPortfolios.studentId],
      references: [students.id],
    }),
    positions: many(positions),
  })
);

export const positionsRelations = relations(positions, ({ one }) => ({
  portfolio: one(simulatedPortfolios, {
    fields: [positions.portfolioId],
    references: [simulatedPortfolios.id],
  }),
}));

export const lessonsRelations = relations(lessons, ({ many }) => ({
  progress: many(lessonProgress),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  student: one(students, {
    fields: [lessonProgress.studentId],
    references: [students.id],
  }),
  lesson: one(lessons, {
    fields: [lessonProgress.lessonId],
    references: [lessons.id],
  }),
}));
