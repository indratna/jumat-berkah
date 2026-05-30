-- CreateTable
CREATE TABLE "donor_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "donor_key" TEXT NOT NULL,
    "user_id" UUID,
    "display_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp_reminder_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp_reminder_opt_in_at" TIMESTAMP(3),
    "whatsapp_reminder_opt_out_at" TIMESTAMP(3),
    "internal_note" TEXT,
    "labels" JSONB NOT NULL DEFAULT '[]',
    "merged_into_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "donor_profiles_donor_key_key" ON "donor_profiles"("donor_key");

-- CreateIndex
CREATE INDEX "donor_profiles_user_id_idx" ON "donor_profiles"("user_id");

-- CreateIndex
CREATE INDEX "donor_profiles_email_idx" ON "donor_profiles"("email");

-- CreateIndex
CREATE INDEX "donor_profiles_phone_idx" ON "donor_profiles"("phone");

-- CreateIndex
CREATE INDEX "donor_profiles_merged_into_id_idx" ON "donor_profiles"("merged_into_id");

-- AddForeignKey
ALTER TABLE "donor_profiles" ADD CONSTRAINT "donor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donor_profiles" ADD CONSTRAINT "donor_profiles_merged_into_id_fkey" FOREIGN KEY ("merged_into_id") REFERENCES "donor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
