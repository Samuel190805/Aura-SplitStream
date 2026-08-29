import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/lib/container";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ jobs: [] });
    }

    const jobs = await container.jobRepository.findByUserId(userId, 20);
    return NextResponse.json({ jobs: jobs.map((j) => j.toJSON()) });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to fetch jobs";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
