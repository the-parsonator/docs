-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "calorieTarget" INTEGER NOT NULL DEFAULT 2000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resetToken" TEXT,
    "resetTokenExpiresAt" DATETIME,
    "photoScansDate" TEXT,
    "photoScansUsed" INTEGER NOT NULL DEFAULT 0,
    "externalCustomerId" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'free',
    "subscriptionId" TEXT,
    "trialEndsAt" DATETIME
);
INSERT INTO "new_User" ("calorieTarget", "createdAt", "email", "id", "passwordHash", "photoScansDate", "photoScansUsed", "resetToken", "resetTokenExpiresAt") SELECT "calorieTarget", "createdAt", "email", "id", "passwordHash", "photoScansDate", "photoScansUsed", "resetToken", "resetTokenExpiresAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_externalCustomerId_key" ON "User"("externalCustomerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
