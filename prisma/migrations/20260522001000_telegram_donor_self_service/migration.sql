ALTER TABLE "users"
  ADD COLUMN "telegram_chat_id" BIGINT,
  ADD COLUMN "telegram_reminder_opt_in" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "telegram_link_code" TEXT;

CREATE UNIQUE INDEX "users_telegram_chat_id_key" ON "users"("telegram_chat_id");
CREATE UNIQUE INDEX "users_telegram_link_code_key" ON "users"("telegram_link_code");
