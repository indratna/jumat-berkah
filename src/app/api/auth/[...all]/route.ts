import { toNextJsHandler } from "better-auth/next-js";

import { betterAuthInstance } from "@/lib/better-auth";

export const { GET, POST } = toNextJsHandler(betterAuthInstance);
