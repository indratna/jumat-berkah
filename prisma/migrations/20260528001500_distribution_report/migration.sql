-- CreateTable
CREATE TABLE "distribution_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cycle_start" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "package_count" INTEGER,
    "location_summary" TEXT,
    "photo_urls" JSONB NOT NULL DEFAULT '[]',
    "published_at" TIMESTAMP(3),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distribution_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "distribution_reports_cycle_start_key" ON "distribution_reports"("cycle_start");

-- CreateIndex
CREATE INDEX "distribution_reports_cycle_start_idx" ON "distribution_reports"("cycle_start");

-- CreateIndex
CREATE INDEX "distribution_reports_published_at_idx" ON "distribution_reports"("published_at");

-- AddForeignKey
ALTER TABLE "distribution_reports" ADD CONSTRAINT "distribution_reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
