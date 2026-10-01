import { getAccountLeaderboard } from "@/lib/account-reports";

export async function GET() {
  try {
    return Response.json(await getAccountLeaderboard(), {
      headers: { "Cache-Control": "public, max-age=30, s-maxage=30" },
    });
  } catch (error) {
    console.error("Leaderboard lookup failed", error);
    return Response.json({ error: "Leaderboard unavailable right now." }, { status: 503 });
  }
}
