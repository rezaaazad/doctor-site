-- AlterTable
ALTER TABLE "StoreProduct" ADD COLUMN     "licensedPlugin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "pluginDays" INTEGER NOT NULL DEFAULT 365,
ADD COLUMN     "pluginTier" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "licenseDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "licenseHost" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "licenseProductId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "licenseTier" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "licenseVariantId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "licenseVersion" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "renewalId" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "PluginLicense" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "blocked" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttempt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lease" TEXT NOT NULL DEFAULT '',
    "artifact" TEXT NOT NULL DEFAULT '',
    "checksum" TEXT NOT NULL DEFAULT '',
    "builtAt" TIMESTAMP(3),
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "PluginLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicensePurchase" (
    "itemId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LicensePurchase_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "LicenseEvent" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LicenseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PluginLicense_customerId_idx" ON "PluginLicense"("customerId");

-- CreateIndex
CREATE INDEX "PluginLicense_state_nextAttempt_idx" ON "PluginLicense"("state", "nextAttempt");

-- CreateIndex
CREATE INDEX "LicensePurchase_licenseId_idx" ON "LicensePurchase"("licenseId");

-- CreateIndex
CREATE INDEX "LicenseEvent_licenseId_createdAt_idx" ON "LicenseEvent"("licenseId", "createdAt");

-- AddForeignKey
ALTER TABLE "LicensePurchase" ADD CONSTRAINT "LicensePurchase_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicensePurchase" ADD CONSTRAINT "LicensePurchase_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "PluginLicense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseEvent" ADD CONSTRAINT "LicenseEvent_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "PluginLicense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
