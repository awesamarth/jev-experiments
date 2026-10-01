import { ImageResponse } from "next/og";
import type { AccountReport } from "@/lib/account-scorer";

export const scoreImageSize = { width: 1200, height: 630 };

export function scoreImage(report: AccountReport) {
  const dimensions = [
    ["SIGNAL", report.scores.signal],
    ["ORIGINALITY", report.scores.originality],
    ["CLARITY", report.scores.clarity],
    ["POSTING HABITS", report.scores.habits],
  ] as const;

  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#b5c2ff", color: "#1e1e1e", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", width: 465, height: "100%", flexDirection: "column", justifyContent: "space-between", background: "#1e1e1e", color: "#f7f7f2", padding: "46px 48px" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 18, letterSpacing: 2, color: "#b5c2ff" }}>JEV EXPERIMENTS / 03</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 54, fontSize: 66, fontWeight: 700, lineHeight: 0.98, letterSpacing: -3 }}>
            <span>Timeline</span>
            <span>verdict<span style={{ color: "#b5c2ff" }}>.</span></span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontSize: report.overall === 100 ? 150 : 205, lineHeight: 0.85, letterSpacing: -7, color: "#b5c2ff" }}>{report.overall}</span>
            <span style={{ marginLeft: 20, fontSize: 25, color: "#b5c2ff" }}>/100</span>
          </div>
          <div style={{ display: "flex", marginTop: 27, fontSize: 21, color: "#b5c2ff" }}>OVERALL SCORE</div>
        </div>
      </div>
      <div style={{ display: "flex", flex: 1, flexDirection: "column", padding: "48px 55px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #1e1e1e", paddingBottom: 22 }}>
          <span style={{ fontSize: 18, letterSpacing: 2 }}>THE PUBLIC RECEIPTS</span>
          <span style={{ fontSize: 18 }}>@{report.handle}</span>
        </div>
        <div style={{ display: "flex", marginTop: 30, fontSize: 40, fontWeight: 700, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 620 }}>{report.name}</div>
        <div style={{ display: "flex", marginTop: 10, fontSize: 20, color: "#343b62" }}>{report.posts.length} posts + {report.replies.length} replies analyzed</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 44, gap: 23 }}>
          {dimensions.map(([label, score]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 700 }}><span>{label}</span><span>{score}</span></div>
              <div style={{ display: "flex", marginTop: 8, height: 9, background: "#e1e5ff" }}>
                <div style={{ display: "flex", width: `${score}%`, height: "100%", background: "#1e1e1e" }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", marginTop: "auto", justifyContent: "space-between", borderTop: "2px solid #1e1e1e", paddingTop: 14, fontSize: 17 }}>
          <span>JEV-EXPERIMENTS.AWESAMARTH.DEV</span>
          <span>{new Date(report.analyzedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).toUpperCase()}</span>
        </div>
      </div>
    </div>,
    { ...scoreImageSize },
  );
}
