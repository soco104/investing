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
  classCount: integer("class_count").notNull().default(0),
  studentCount: integer("student_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const appUsers = sqliteTable("app_users", {
  id: text("id").primaryKey(),
  districtId: text("district_id")
    .notNull()
    .references(() => districts.id),
  schoolId: text("school_id").references(() => schools.id),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const roleAssignments = sqliteTable("role_assignments", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => appUsers.id),
  role: text("role").notNull(),
  scope: text("scope").notNull(),
  assignedByUserId: text("assigned_by_user_id").notNull(),
  assignedAt: integer("assigned_at", { mode: "timestamp" }).notNull(),
});

export const userPermissionGrants = sqliteTable("user_permission_grants", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => appUsers.id),
  permission: text("permission").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  grantedByUserId: text("granted_by_user_id").notNull(),
  grantedAt: integer("granted_at", { mode: "timestamp" }).notNull(),
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

export const portfolioActivities = sqliteTable("portfolio_activities", {
  id: text("id").primaryKey(),
  portfolioId: text("portfolio_id")
    .notNull()
    .references(() => simulatedPortfolios.id),
  activityType: text("activity_type").notNull(),
  vehicle: text("vehicle").notNull(),
  amountCents: integer("amount_cents").notNull().default(0),
  beforeAllocationJson: text("before_allocation_json"),
  afterAllocationJson: text("after_allocation_json"),
  note: text("note").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
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

export const supportTickets = sqliteTable("support_tickets", {
  id: text("id").primaryKey(),
  districtId: text("district_id")
    .notNull()
    .references(() => districts.id),
  reportedByUserId: text("reported_by_user_id").notNull(),
  category: text("category").notNull(),
  summary: text("summary").notNull(),
  status: text("status").notNull().default("open"),
  supportContactEmail: text("support_contact_email").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
});

export const marketDataIntegrations = sqliteTable("market_data_integrations", {
  id: text("id").primaryKey(),
  districtId: text("district_id")
    .notNull()
    .references(() => districts.id),
  providerName: text("provider_name").notNull(),
  endpointUrl: text("endpoint_url").notNull(),
  status: text("status").notNull().default("not_configured"),
  allowedSymbolsCsv: text("allowed_symbols_csv").notNull().default(""),
  maxSymbols: integer("max_symbols").notNull().default(200),
  tokenRequired: integer("token_required", { mode: "boolean" })
    .notNull()
    .default(false),
  tokenSecretRef: text("token_secret_ref"),
  pollingFrequencyMinutes: integer("polling_frequency_minutes")
    .notNull()
    .default(15),
  delayedQuotes: integer("delayed_quotes", { mode: "boolean" })
    .notNull()
    .default(true),
  configuredByUserId: text("configured_by_user_id"),
  lastHealthCheckAt: integer("last_health_check_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const marketIntegrationClassAssignments = sqliteTable(
  "market_integration_class_assignments",
  {
    id: text("id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => marketDataIntegrations.id),
    classroomId: text("classroom_id")
      .notNull()
      .references(() => classrooms.id),
    status: text("status").notNull().default("active"),
    assignedByUserId: text("assigned_by_user_id").notNull(),
    assignedAt: integer("assigned_at", { mode: "timestamp" }).notNull(),
    endedAt: integer("ended_at", { mode: "timestamp" }),
  }
);

export const privacyPostureSettings = sqliteTable(
  "privacy_posture_settings",
  {
    id: text("id").primaryKey(),
    districtId: text("district_id")
      .notNull()
      .references(() => districts.id),
    posture: text("posture").notNull().default("standard"),
    privacyContactEmail: text("privacy_contact_email").notNull(),
    stateCode: text("state_code").notNull(),
    retentionPolicy: text("retention_policy").notNull().default("standard"),
    requiresIntegrationApproval: integer("requires_integration_approval", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
    updatedByUserId: text("updated_by_user_id").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  }
);

export const passwordResetRequests = sqliteTable("password_reset_requests", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => appUsers.id),
  requestedByUserId: text("requested_by_user_id").notNull(),
  status: text("status").notNull().default("pending"),
  requestedAt: integer("requested_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

export const portfolioCorrections = sqliteTable("portfolio_corrections", {
  id: text("id").primaryKey(),
  portfolioId: text("portfolio_id")
    .notNull()
    .references(() => simulatedPortfolios.id),
  correctedByUserId: text("corrected_by_user_id").notNull(),
  correctionType: text("correction_type").notNull(),
  beforeSnapshotJson: text("before_snapshot_json").notNull(),
  afterSnapshotJson: text("after_snapshot_json").notNull(),
  auditReason: text("audit_reason").notNull(),
  correctedAt: integer("corrected_at", { mode: "timestamp" }).notNull(),
});

export const adminAuditEvents = sqliteTable("admin_audit_events", {
  id: text("id").primaryKey(),
  districtId: text("district_id")
    .notNull()
    .references(() => districts.id),
  actorUserId: text("actor_user_id").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  reason: text("reason"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
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
  users: many(appUsers),
  supportTickets: many(supportTickets),
  marketDataIntegrations: many(marketDataIntegrations),
  privacyPostureSettings: many(privacyPostureSettings),
  auditEvents: many(adminAuditEvents),
}));

export const schoolsRelations = relations(schools, ({ one, many }) => ({
  district: one(districts, {
    fields: [schools.districtId],
    references: [districts.id],
  }),
  classrooms: many(classrooms),
  users: many(appUsers),
}));

export const appUsersRelations = relations(appUsers, ({ one, many }) => ({
  district: one(districts, {
    fields: [appUsers.districtId],
    references: [districts.id],
  }),
  school: one(schools, {
    fields: [appUsers.schoolId],
    references: [schools.id],
  }),
  roles: many(roleAssignments),
  permissionGrants: many(userPermissionGrants),
  passwordResetRequests: many(passwordResetRequests),
}));

export const roleAssignmentsRelations = relations(
  roleAssignments,
  ({ one }) => ({
    user: one(appUsers, {
      fields: [roleAssignments.userId],
      references: [appUsers.id],
    }),
  })
);

export const userPermissionGrantsRelations = relations(
  userPermissionGrants,
  ({ one }) => ({
    user: one(appUsers, {
      fields: [userPermissionGrants.userId],
      references: [appUsers.id],
    }),
  })
);

export const classroomsRelations = relations(classrooms, ({ one, many }) => ({
  school: one(schools, {
    fields: [classrooms.schoolId],
    references: [schools.id],
  }),
  students: many(students),
  learningQuests: many(learningQuests),
  questAssignments: many(questAssignments),
  conversations: many(conversations),
  marketIntegrationAssignments: many(marketIntegrationClassAssignments),
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
    activities: many(portfolioActivities),
    corrections: many(portfolioCorrections),
  })
);

export const positionsRelations = relations(positions, ({ one }) => ({
  portfolio: one(simulatedPortfolios, {
    fields: [positions.portfolioId],
    references: [simulatedPortfolios.id],
  }),
}));

export const portfolioActivitiesRelations = relations(
  portfolioActivities,
  ({ one }) => ({
    portfolio: one(simulatedPortfolios, {
      fields: [portfolioActivities.portfolioId],
      references: [simulatedPortfolios.id],
    }),
  })
);

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

export const supportTicketsRelations = relations(supportTickets, ({ one }) => ({
  district: one(districts, {
    fields: [supportTickets.districtId],
    references: [districts.id],
  }),
}));

export const marketDataIntegrationsRelations = relations(
  marketDataIntegrations,
  ({ one, many }) => ({
    district: one(districts, {
      fields: [marketDataIntegrations.districtId],
      references: [districts.id],
    }),
    classAssignments: many(marketIntegrationClassAssignments),
  })
);

export const marketIntegrationClassAssignmentsRelations = relations(
  marketIntegrationClassAssignments,
  ({ one }) => ({
    integration: one(marketDataIntegrations, {
      fields: [marketIntegrationClassAssignments.integrationId],
      references: [marketDataIntegrations.id],
    }),
    classroom: one(classrooms, {
      fields: [marketIntegrationClassAssignments.classroomId],
      references: [classrooms.id],
    }),
  })
);

export const privacyPostureSettingsRelations = relations(
  privacyPostureSettings,
  ({ one }) => ({
    district: one(districts, {
      fields: [privacyPostureSettings.districtId],
      references: [districts.id],
    }),
  })
);

export const passwordResetRequestsRelations = relations(
  passwordResetRequests,
  ({ one }) => ({
    user: one(appUsers, {
      fields: [passwordResetRequests.userId],
      references: [appUsers.id],
    }),
  })
);

export const portfolioCorrectionsRelations = relations(
  portfolioCorrections,
  ({ one }) => ({
    portfolio: one(simulatedPortfolios, {
      fields: [portfolioCorrections.portfolioId],
      references: [simulatedPortfolios.id],
    }),
  })
);

export const adminAuditEventsRelations = relations(
  adminAuditEvents,
  ({ one }) => ({
    district: one(districts, {
      fields: [adminAuditEvents.districtId],
      references: [districts.id],
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
