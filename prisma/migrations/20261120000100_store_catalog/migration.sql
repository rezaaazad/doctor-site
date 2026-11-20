CREATE TABLE "StoreCategory" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL
);

CREATE TABLE "StoreProduct" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "priceRial" BIGINT NOT NULL CHECK ("priceRial" >= 0),
  "published" BOOLEAN NOT NULL DEFAULT false,
  "categoryId" TEXT NOT NULL REFERENCES "StoreCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "StoreProduct_categoryId_published_idx" ON "StoreProduct" ("categoryId", "published");
