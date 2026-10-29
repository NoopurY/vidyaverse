import { env } from "@/lib/env";
import { openApiSpec } from "@/lib/openapi";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(openApiSpec(env.appUrl));
}
