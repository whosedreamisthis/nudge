-- DropIndex
DROP INDEX "JournalEntry_userId_date_key";

-- CreateIndex
CREATE INDEX "JournalEntry_userId_date_idx" ON "JournalEntry"("userId", "date");
