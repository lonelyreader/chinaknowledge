import config from "@payload-config";
import { getPayload } from "payload";

export const dynamic = "force-dynamic";

const responseHeaders = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const payload = await getPayload({ config });
    await payload.count({ collection: "articles", overrideAccess: true });
    return Response.json({ status: "ok" }, { headers: responseHeaders });
  } catch {
    return Response.json(
      { status: "unavailable" },
      { headers: responseHeaders, status: 503 },
    );
  }
}
