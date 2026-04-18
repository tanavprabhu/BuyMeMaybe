-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "askingPrice" INTEGER NOT NULL,
    "originalPrice" INTEGER,
    "urgencyDays" INTEGER NOT NULL,
    "sellerName" TEXT NOT NULL,
    "sellerLocation" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "captions" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Item_createdAt_idx" ON "Item"("createdAt");

-- CreateIndex
CREATE INDEX "Item_category_idx" ON "Item"("category");
