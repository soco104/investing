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

export const learningQuests = sqliteTable("learning_quests", {
  id: text("id").primaryKey(),
  classroomId: text("classroom_id").references(() => classrooms.id),
  districtId: text("district_id").references(() => districts.id),
  createdByUserId: text("created_by_user_id").notNull(),
  title: text("title").notNull(),
  objective: text("objective").notNull(),
  status: text("status").notNull().default("draft"),
  scoreVisibility: text("score_visibility").notNull().default("hidden"),
  requireReflection: integer("require_reflection", { mode: "boolean" })
    .notNull()
    .default(true),
  isDistrictTemplate: integer("is_district_template", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const questMarketParameters = sqliteTable("quest_market_parameters", {
  id: text("id").primaryKey(),
  questId: text("quest_id")
    .notNull()
    .references(() => learningQuests.id),
  mode: text("mode").notNull().default("none"),
  symbolsCsv: text("symbols_csv").notNull().default(""),
  marketWindow: text("market_window").notNull().default(""),
  scenarioPrompt: text("scenario_prompt"),
});

export const questScoringRules = sqliteTable("quest_scoring_rules", {
  id: text("id").primaryKey(),
  questId: text("quest_id")
    .notNull()
    .references(() => learningQuests.id),
  label: text("label").notNull(),
  points: integer("points").notNull(),
  visibleToStudents: integer("visible_to_students", { mode: "boolean" })
    .notNull()
    .default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const questAssignments = sqliteTable("quest_assignments", {
  id: text("id").primaryKey(),
  questId: text("quest_id")
    .notNull()
    .references(() => learningQuests.id),
  classroomId: text("classroom_id")
    .notNull()
    .references(() => classrooms.id),
  assignedByUserId: text("assigned_by_user_id").notNull(),
  dueAt: integer("due_at", { mode: "timestamp" }),
  assignedAt: integer("assigned_at", { mode: "timestamp" }).notNull(),
});

export const questSubmissions = sqliteTable("quest_submissions", {
  id: text("id").primaryKey(),
  assignmentId: text("assignment_id")
    .notNull()
    .references(() => questAssignments.id),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id),
  status: text("status").notNull().default("in_progress"),
  visibleScore: integer("visible_score"),
  teacherScore: integer("teacher_score"),
  reflection: text("reflection"),
  flaggedForReview: integer("flagged_for_review", { mode: "boolean" })
    .notNull()
    .default(false),
  submittedAt: integer("submitted_at", { mode: "timestamp" }),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
});

export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id"),
  classroomId: text("classroom_id").references(() => classrooms.id),
  title: text("title").notNull(),
  scope: text("scope").notNull().default("direct"),
  kind: text("kind").notNull(),
  textOnly: integer("text_only", { mode: "boolean" }).notNull().default(true),
  createdByUserId: text("created_by_user_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const conversationParticipants = sqliteTable(
  "conversation_participants",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id),
    userId: text("user_id").notNull(),
    role: text("role").notNull(),
    displayName: text("display_name").notNull(),
    lastReadAt: integer("last_read_at", { mode: "timestamp" }),
  }
);

export const conversationMessages = sqliteTable("conversation_messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id),
  senderUserId: text("sender_user_id").notNull(),
  body: text("body").notNull(),
  moderationStatus: text("moderation_status").notNull().default("allowed"),
  profanityDetected: integer("profanity_detected", { mode: "boolean" })
    .notNull()
    .default(false),
  sentAt: integer("sent_at", { mode: "timestamp" }).notNull(),
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
  learningQuests: many(learningQuests),
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
  learningQuests: many(learningQuests),
  questAssignments: many(questAssignments),
  conversations: many(conversations),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  classroom: one(classrooms, {
    fields: [students.classroomId],
    references: [classrooms.id],
  }),
  portfolios: many(simulatedPortfolios),
  progress: many(lessonProgress),
  questSubmissions: many(questSubmissions),
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

export const learningQuestsRelations = relations(
  learningQuests,
  ({ one, many }) => ({
    classroom: one(classrooms, {
      fields: [learningQuests.classroomId],
      references: [classrooms.id],
    }),
    district: one(districts, {
      fields: [learningQuests.districtId],
      references: [districts.id],
    }),
    marketParameters: many(questMarketParameters),
    scoringRules: many(questScoringRules),
    assignments: many(questAssignments),
  })
);

export const questMarketParametersRelations = relations(
  questMarketParameters,
  ({ one }) => ({
    quest: one(learningQuests, {
      fields: [questMarketParameters.questId],
      references: [learningQuests.id],
    }),
  })
);

export const questScoringRulesRelations = relations(
  questScoringRules,
  ({ one }) => ({
    quest: one(learningQuests, {
      fields: [questScoringRules.questId],
      references: [learningQuests.id],
    }),
  })
);

export const questAssignmentsRelations = relations(
  questAssignments,
  ({ one, many }) => ({
    quest: one(learningQuests, {
      fields: [questAssignments.questId],
      references: [learningQuests.id],
    }),
    classroom: one(classrooms, {
      fields: [questAssignments.classroomId],
      references: [classrooms.id],
    }),
    submissions: many(questSubmissions),
  })
);

export const questSubmissionsRelations = relations(
  questSubmissions,
  ({ one }) => ({
    assignment: one(questAssignments, {
      fields: [questSubmissions.assignmentId],
      references: [questAssignments.id],
    }),
    student: one(students, {
      fields: [questSubmissions.studentId],
      references: [students.id],
    }),
  })
);

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    classroom: one(classrooms, {
      fields: [conversations.classroomId],
      references: [classrooms.id],
    }),
    participants: many(conversationParticipants),
    messages: many(conversationMessages),
  })
);

export const conversationParticipantsRelations = relations(
  conversationParticipants,
  ({ one }) => ({
    conversation: one(conversations, {
      fields: [conversationParticipants.conversationId],
      references: [conversations.id],
    }),
  })
);

export const conversationMessagesRelations = relations(
  conversationMessages,
  ({ one }) => ({
    conversation: one(conversations, {
      fields: [conversationMessages.conversationId],
      references: [conversations.id],
    }),
  })
);

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
