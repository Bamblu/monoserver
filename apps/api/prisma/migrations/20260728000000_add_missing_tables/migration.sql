-- Add missing codeforcesHandle column to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "codeforcesHandle" TEXT;

-- Add unique index for codeforcesHandle (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'User' AND indexname = 'User_codeforcesHandle_key'
  ) THEN
    CREATE UNIQUE INDEX "User_codeforcesHandle_key" ON "User"("codeforcesHandle");
  END IF;
END$$;

-- Create GitHubConnection table (if not exists)
CREATE TABLE IF NOT EXISTS "GitHubConnection" (
    "id"           TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "githubUserId" TEXT NOT NULL,
    "username"     TEXT NOT NULL,
    "accessToken"  TEXT NOT NULL,
    "scopes"       TEXT,
    "connectedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GitHubConnection_pkey" PRIMARY KEY ("id")
);

-- Unique index on userId (one GitHub connection per user)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'GitHubConnection' AND indexname = 'GitHubConnection_userId_key'
  ) THEN
    CREATE UNIQUE INDEX "GitHubConnection_userId_key" ON "GitHubConnection"("userId");
  END IF;
END$$;

-- Foreign key from GitHubConnection to User
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'GitHubConnection_userId_fkey'
  ) THEN
    ALTER TABLE "GitHubConnection"
      ADD CONSTRAINT "GitHubConnection_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;
