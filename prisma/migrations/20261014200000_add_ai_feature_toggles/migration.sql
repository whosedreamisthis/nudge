-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aiHabitSuggestions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "aiMotivation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "aiWeeklyReport" BOOLEAN NOT NULL DEFAULT true;

-- Keep each user's choice from the old single switch
UPDATE "User" SET "aiHabitSuggestions" = "aiEnabled", "aiMotivation" = "aiEnabled", "aiWeeklyReport" = "aiEnabled";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "aiEnabled";
