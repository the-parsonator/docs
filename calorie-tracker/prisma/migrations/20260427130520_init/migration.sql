-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "calorieTarget" INTEGER NOT NULL DEFAULT 2000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resetToken" TEXT,
    "resetTokenExpiresAt" DATETIME,
    "photoScansDate" TEXT,
    "photoScansUsed" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "DailyLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "calorieTarget" INTEGER NOT NULL,
    CONSTRAINT "DailyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FoodEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dailyLogId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FoodEntry_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "DailyLog" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DailyLog_userId_date_key" ON "DailyLog"("userId", "date");
