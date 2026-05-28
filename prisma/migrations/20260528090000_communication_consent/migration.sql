ALTER TABLE "donations"
  ADD COLUMN "whatsapp_reminder_opt_in" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "whatsapp_reminder_opt_in_at" TIMESTAMP(3),
  ADD COLUMN "whatsapp_reminder_opt_out_at" TIMESTAMP(3);

CREATE INDEX "donations_whatsapp_reminder_opt_in_idx" ON "donations"("whatsapp_reminder_opt_in");
