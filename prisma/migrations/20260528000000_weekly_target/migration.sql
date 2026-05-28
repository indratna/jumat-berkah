-- CreateTable
CREATE TABLE "weekly_targets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cycle_start" DATE NOT NULL,
    "cycle_end" DATE NOT NULL,
    "target_amount" INTEGER NOT NULL,
    "note" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_targets_cycle_start_key" ON "weekly_targets"("cycle_start");

-- CreateIndex
CREATE INDEX "weekly_targets_cycle_start_idx" ON "weekly_targets"("cycle_start");

-- AddForeignKey
ALTER TABLE "weekly_targets" ADD CONSTRAINT "weekly_targets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
