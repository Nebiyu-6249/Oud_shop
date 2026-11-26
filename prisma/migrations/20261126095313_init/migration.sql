-- CreateEnum
CREATE TYPE "Family" AS ENUM ('FLORAL', 'AMBER', 'WOODY', 'FRESH');

-- CreateEnum
CREATE TYPE "Form" AS ENUM ('EDP', 'EXTRAIT', 'ATTAR', 'BAKHOOR');

-- CreateEnum
CREATE TYPE "Structure" AS ENUM ('PYRAMID', 'CHORD');

-- CreateEnum
CREATE TYPE "Wear" AS ENUM ('DAY', 'NIGHT', 'BOTH');

-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('TOP', 'HEART', 'BASE', 'CHORD');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "Realm" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "storyEn" TEXT NOT NULL,
    "storyAr" TEXT NOT NULL,
    "palette" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Realm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fragrance" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "realmId" TEXT NOT NULL,
    "family" "Family" NOT NULL,
    "subfamily" TEXT NOT NULL,
    "form" "Form" NOT NULL,
    "structure" "Structure" NOT NULL,
    "intensity" INTEGER NOT NULL,
    "wear" "Wear" NOT NULL,
    "storyEn" TEXT NOT NULL,
    "storyAr" TEXT NOT NULL,
    "flaconParams" JSONB NOT NULL,

    CONSTRAINT "Fragrance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL,
    "fragranceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "priceFils" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "ornamentKey" TEXT NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FragranceNote" (
    "fragranceId" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "tier" "Tier" NOT NULL,
    "weight" INTEGER NOT NULL,

    CONSTRAINT "FragranceNote_pkey" PRIMARY KEY ("fragranceId","noteId")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalFils" INTEGER NOT NULL,
    "vatFils" INTEGER NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unitPriceFils" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Realm_slug_key" ON "Realm"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Fragrance_slug_key" ON "Fragrance"("slug");

-- CreateIndex
CREATE INDEX "Fragrance_realmId_idx" ON "Fragrance"("realmId");

-- CreateIndex
CREATE UNIQUE INDEX "Variant_sku_key" ON "Variant"("sku");

-- CreateIndex
CREATE INDEX "Variant_fragranceId_idx" ON "Variant"("fragranceId");

-- CreateIndex
CREATE INDEX "FragranceNote_noteId_idx" ON "FragranceNote"("noteId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "Order"("stripeSessionId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- AddForeignKey
ALTER TABLE "Fragrance" ADD CONSTRAINT "Fragrance_realmId_fkey" FOREIGN KEY ("realmId") REFERENCES "Realm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_fragranceId_fkey" FOREIGN KEY ("fragranceId") REFERENCES "Fragrance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FragranceNote" ADD CONSTRAINT "FragranceNote_fragranceId_fkey" FOREIGN KEY ("fragranceId") REFERENCES "Fragrance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FragranceNote" ADD CONSTRAINT "FragranceNote_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
