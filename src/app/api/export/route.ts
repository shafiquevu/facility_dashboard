import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { exportCsv } from "@/lib/api";

// The renewal export, streamed from the maintenance service. Signed-in,
// allowed users only: it lists every building and its evidence links.
export async function GET() {
  const user = await getUser();
  if (!user?.allowed) return new NextResponse("Not allowed", { status: 403 });
  const upstream = await exportCsv();
  if (!upstream.ok) return new NextResponse("The export could not be produced.", { status: 502 });
  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": upstream.headers.get("Content-Disposition") ?? 'attachment; filename="facility-maintenance.csv"',
      "Cache-Control": "no-store",
    },
  });
}
