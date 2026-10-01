import { notFound } from "next/navigation";
import { findReportById } from "@/lib/account-reports";
import { scoreImage, scoreImageSize } from "@/lib/score-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "Jev's X account scorecard";
export const size = scoreImageSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await findReportById(id);
  if (!report) notFound();
  return scoreImage(report);
}
