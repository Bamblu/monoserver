import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  integer,
  boolean,
  real,
  uuid,
  jsonb,
  varchar,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const syncStatusEnum = pgEnum('sync_status', [
  'idle',
  'syncing',
  'success',
  'error',
]);

export const activityTypeEnum = pgEnum('activity_type', [
  'commit',
  'pr_open',
  'pr_merge',
  'issue',
  'review',
]);

export const cfVerdictEnum = pgEnum('cf_verdict', [
  'AC',
  'WA',
  'TLE',
  'MLE',
  'RE',
  'CE',
  'SK',
  'PARTIAL',
]);

export const skillCategoryEnum = pgEnum('skill_category', [
  'Data Structures',
  'Algorithms',
  'System Design',
  'Languages',
  'Frameworks',
  'DevOps',
  'Database',
]);

export const skillTrendEnum = pgEnum('skill_trend', ['rising', 'stable', 'declining']);

export const roadmapStatusEnum = pgEnum('roadmap_status', [
  'not_started',
  'in_progress',
  'completed',
  'skipped',
]);

// ─── NextAuth Tables ──────────────────────────────────────────────────────────
// Schema follows the @auth/drizzle-adapter convention for NextAuth v5

export const users = pgTable(
  'User',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    email: text('email').notNull().unique(),
    emailVerified: timestamp('emailVerified', { mode: 'date' }),
    image: text('image'),
    codeforcesHandle: varchar('codeforcesHandle', { length: 24 }).unique(),
    codeforcesSyncStatus: syncStatusEnum('codeforces_sync_status').notNull().default('idle'),
    codeforcesLastSyncedAt: timestamp('codeforces_last_synced_at', { mode: 'date' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('User_email_idx').on(t.email),
    index('User_codeforcesHandle_idx').on(t.codeforcesHandle),
  ]
);

export const accounts = pgTable(
  'Account',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refreshToken: text('refreshToken'),
    accessToken: text('accessToken'),
    expiresAt: integer('expiresAt'),
    tokenType: text('tokenType'),
    scope: text('scope'),
    idToken: text('idToken'),
    sessionState: text('sessionState'),
  },
  (t) => [
    index('Account_userId_idx').on(t.userId),
  ]
);

export const sessions = pgTable(
  'Session',
  {
    id: text('id').primaryKey(),
    sessionToken: text('sessionToken').notNull().unique(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (t) => [index('Session_userId_idx').on(t.userId)]
);

export const githubConnections = pgTable(
  'GitHubConnection',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    githubUserId: text('githubUserId').notNull(),
    username: text('username').notNull(),
    accessToken: text('accessToken').notNull(),
    scopes: text('scopes'),
    connectedAt: timestamp('connectedAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('GitHubConnection_userId_idx').on(t.userId),
  ]
);

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

// ─── GitHub Activity ──────────────────────────────────────────────────────────

export const githubActivity = pgTable(
  'github_activity',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    repo: text('repo').notNull(),                     // "owner/repo"
    activityType: activityTypeEnum('activity_type').notNull(),
    message: text('message'),
    url: text('url').notNull(),
    sha: varchar('sha', { length: 40 }),              // commit SHA if applicable
    additions: integer('additions').default(0),
    deletions: integer('deletions').default(0),
    language: varchar('language', { length: 50 }),
    occurredAt: timestamp('occurred_at', { mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('github_activity_user_id_idx').on(t.userId),
    index('github_activity_occurred_at_idx').on(t.occurredAt),
    index('github_activity_user_date_idx').on(t.userId, t.occurredAt),
    uniqueIndex('github_activity_sha_unique').on(t.sha),
  ]
);

// ─── GitHub Stats Snapshot ────────────────────────────────────────────────────

export const githubStats = pgTable(
  'github_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    totalCommits: integer('total_commits').notNull().default(0),
    totalPRs: integer('total_prs').notNull().default(0),
    totalStars: integer('total_stars').notNull().default(0),
    totalRepos: integer('total_repos').notNull().default(0),
    contributionStreak: integer('contribution_streak').notNull().default(0),
    longestStreak: integer('longest_streak').notNull().default(0),
    /** [{ language, linesOfCode, percentage, color }] */
    topLanguages: jsonb('top_languages').$type<
      { language: string; linesOfCode: number; percentage: number; color: string | null }[]
    >().default([]),
    /** Raw heatmap: { "YYYY-MM-DD": count } */
    contributionHeatmap: jsonb('contribution_heatmap').$type<Record<string, number>>().default({}),
    snapshotAt: timestamp('snapshot_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('github_stats_user_id_idx').on(t.userId),
    index('github_stats_snapshot_at_idx').on(t.snapshotAt),
  ]
);

// ─── Codeforces Activity ──────────────────────────────────────────────────────

export const codeforcesActivity = pgTable(
  'codeforces_activity',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    submissionId: integer('submission_id').notNull(),  // CF submission ID
    contestId: integer('contest_id'),
    problemIndex: varchar('problem_index', { length: 10 }),  // e.g. "1A", "2B"
    problemId: text('problem_id').notNull(),           // "{contestId}{index}"
    problemName: text('problem_name'),
    verdict: cfVerdictEnum('verdict').notNull(),
    difficulty: integer('difficulty'),                 // CF problem rating
    tags: text('tags').array().notNull().default([]),
    language: varchar('language', { length: 50 }),
    timeMs: integer('time_ms'),
    memoryKb: integer('memory_kb'),
    occurredAt: timestamp('occurred_at', { mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('cf_activity_user_id_idx').on(t.userId),
    index('cf_activity_occurred_at_idx').on(t.occurredAt),
    index('cf_activity_user_date_idx').on(t.userId, t.occurredAt),
    index('cf_activity_verdict_idx').on(t.verdict),
    uniqueIndex('cf_activity_submission_unique').on(t.userId, t.submissionId),
  ]
);

// ─── Codeforces Stats Snapshot ────────────────────────────────────────────────

export const codeforcesStats = pgTable(
  'codeforces_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    handle: varchar('handle', { length: 24 }).notNull(),
    rating: integer('rating').notNull().default(0),
    maxRating: integer('max_rating').notNull().default(0),
    rank: varchar('rank', { length: 30 }),
    maxRank: varchar('max_rank', { length: 30 }),
    solvedCount: integer('solved_count').notNull().default(0),
    contestCount: integer('contest_count').notNull().default(0),
    /** [{ contestId, contestName, rank, ratingChange, newRating, ratedAt }] */
    ratingHistory: jsonb('rating_history').$type<
      {
        contestId: number;
        contestName: string;
        rank: number;
        ratingChange: number;
        newRating: number;
        ratedAt: string;
      }[]
    >().default([]),
    snapshotAt: timestamp('snapshot_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('cf_stats_user_id_idx').on(t.userId),
    index('cf_stats_snapshot_at_idx').on(t.snapshotAt),
  ]
);

// ─── Skills ───────────────────────────────────────────────────────────────────

export const skills = pgTable(
  'skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    category: skillCategoryEnum('category').notNull(),
    level: real('level').notNull().default(0),       // 0–100
    trend: skillTrendEnum('trend').notNull().default('stable'),
    evidenceSources: text('evidence_sources').array().notNull().default([]),
    computedAt: timestamp('computed_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('skills_user_id_idx').on(t.userId),
    uniqueIndex('skills_user_name_unique').on(t.userId, t.name),
  ]
);

// ─── Skill Gaps ───────────────────────────────────────────────────────────────

export const skillGaps = pgTable(
  'skill_gaps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    skillName: varchar('skill_name', { length: 100 }).notNull(),
    category: skillCategoryEnum('category').notNull(),
    currentLevel: real('current_level').notNull().default(0),
    requiredLevel: real('required_level').notNull(),
    demandScore: real('demand_score').notNull().default(0),  // 0-100
    computedAt: timestamp('computed_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('skill_gaps_user_id_idx').on(t.userId),
    index('skill_gaps_demand_score_idx').on(t.demandScore),
  ]
);

// ─── Roadmaps ─────────────────────────────────────────────────────────────────

export const roadmaps = pgTable(
  'roadmaps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    targetRole: varchar('target_role', { length: 100 }).notNull(),
    targetCompanies: text('target_companies').array().notNull().default([]),
    completionPercent: real('completion_percent').notNull().default(0),
    generatedAt: timestamp('generated_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('roadmaps_user_id_idx').on(t.userId),
  ]
);

export const roadmapSteps = pgTable(
  'roadmap_steps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roadmapId: uuid('roadmap_id')
      .notNull()
      .references(() => roadmaps.id, { onDelete: 'cascade' }),
    order: integer('order').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    estimatedHours: integer('estimated_hours').notNull().default(0),
    resourceUrls: text('resource_urls').array().notNull().default([]),
    status: roadmapStatusEnum('status').notNull().default('not_started'),
    completedAt: timestamp('completed_at', { mode: 'date' }),
  },
  (t) => [
    index('roadmap_steps_roadmap_id_idx').on(t.roadmapId),
    index('roadmap_steps_order_idx').on(t.roadmapId, t.order),
  ]
);

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 200 }).notNull(),
    company: varchar('company', { length: 100 }).notNull(),
    location: varchar('location', { length: 100 }),
    isRemote: boolean('is_remote').notNull().default(false),
    requiredSkills: text('required_skills').array().notNull().default([]),
    salaryMin: integer('salary_min'),
    salaryMax: integer('salary_max'),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    url: text('url').notNull(),
    source: varchar('source', { length: 50 }).notNull(),
    postedAt: timestamp('posted_at', { mode: 'date' }).notNull(),
    expiresAt: timestamp('expires_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('jobs_company_idx').on(t.company),
    index('jobs_posted_at_idx').on(t.postedAt),
    index('jobs_is_remote_idx').on(t.isRemote),
    uniqueIndex('jobs_url_unique').on(t.url),
  ]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many, one: _one }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  githubConnections: many(githubConnections),
  githubActivity: many(githubActivity),
  githubStats: many(githubStats),
  codeforcesActivity: many(codeforcesActivity),
  codeforcesStats: many(codeforcesStats),
  skills: many(skills),
  skillGaps: many(skillGaps),
  roadmaps: many(roadmaps),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const githubConnectionsRelations = relations(githubConnections, ({ one }) => ({
  user: one(users, { fields: [githubConnections.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const githubActivityRelations = relations(githubActivity, ({ one }) => ({
  user: one(users, { fields: [githubActivity.userId], references: [users.id] }),
}));

export const githubStatsRelations = relations(githubStats, ({ one }) => ({
  user: one(users, { fields: [githubStats.userId], references: [users.id] }),
}));

export const codeforcesActivityRelations = relations(codeforcesActivity, ({ one }) => ({
  user: one(users, { fields: [codeforcesActivity.userId], references: [users.id] }),
}));

export const codeforcesStatsRelations = relations(codeforcesStats, ({ one }) => ({
  user: one(users, { fields: [codeforcesStats.userId], references: [users.id] }),
}));

export const skillsRelations = relations(skills, ({ one }) => ({
  user: one(users, { fields: [skills.userId], references: [users.id] }),
}));

export const skillGapsRelations = relations(skillGaps, ({ one }) => ({
  user: one(users, { fields: [skillGaps.userId], references: [users.id] }),
}));

export const roadmapsRelations = relations(roadmaps, ({ one, many }) => ({
  user: one(users, { fields: [roadmaps.userId], references: [users.id] }),
  steps: many(roadmapSteps),
}));

export const roadmapStepsRelations = relations(roadmapSteps, ({ one }) => ({
  roadmap: one(roadmaps, { fields: [roadmapSteps.roadmapId], references: [roadmaps.id] }),
}));

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type GitHubConnection = typeof githubConnections.$inferSelect;
export type NewGitHubConnection = typeof githubConnections.$inferInsert;

export type GitHubActivity = typeof githubActivity.$inferSelect;
export type NewGitHubActivity = typeof githubActivity.$inferInsert;

export type GitHubStats = typeof githubStats.$inferSelect;
export type NewGitHubStats = typeof githubStats.$inferInsert;

export type CodeforcesActivity = typeof codeforcesActivity.$inferSelect;
export type NewCodeforcesActivity = typeof codeforcesActivity.$inferInsert;

export type CodeforcesStats = typeof codeforcesStats.$inferSelect;
export type NewCodeforcesStats = typeof codeforcesStats.$inferInsert;

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;

export type SkillGap = typeof skillGaps.$inferSelect;
export type NewSkillGap = typeof skillGaps.$inferInsert;

export type Roadmap = typeof roadmaps.$inferSelect;
export type NewRoadmap = typeof roadmaps.$inferInsert;

export type RoadmapStep = typeof roadmapSteps.$inferSelect;
export type NewRoadmapStep = typeof roadmapSteps.$inferInsert;

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
