CREATE TABLE "admin_notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_notifications_read_at_idx" ON "admin_notifications"("read_at");
CREATE INDEX "admin_notifications_created_at_idx" ON "admin_notifications"("created_at");
CREATE INDEX "admin_notifications_entity_type_entity_id_idx" ON "admin_notifications"("entity_type", "entity_id");
