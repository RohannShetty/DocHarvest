import { ImageResponse } from "next/og";
import { STATS, PRODUCT_FACTS } from "../lib/stats";

export const dynamic = "force-static";
export const alt = "DocHarvest — Documentation Compiler for LLMs, RAG & FastMCP";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#09090b",
          padding: "60px 80px",
          fontFamily: "sans-serif",
          color: "#f4f4f5",
          border: "12px solid #18181b",
        }}
      >
        {/* Top Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "20px",
                height: "20px",
                backgroundColor: "#f59e0b",
              }}
            />
            <span
              style={{
                fontSize: "28px",
                fontWeight: 800,
                letterSpacing: "0.05em",
                color: "#f4f4f5",
              }}
            >
              DOCHARVEST
            </span>
          </div>
          <span
            style={{
              fontSize: "18px",
              color: "#a1a1aa",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Universal Doc Compiler & MCP
          </span>
        </div>

        {/* Hero Title & Value Proposition */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1000px" }}>
          <h1
            style={{
              fontSize: "56px",
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#ffffff",
              margin: 0,
            }}
          >
            Turn any docs site into clean LLM context your agent can use.
          </h1>
          <p
            style={{
              fontSize: "24px",
              lineHeight: 1.4,
              color: "#a1a1aa",
              margin: 0,
            }}
          >
            Zero cookie banners or HTML junk. 100% local, MIT, embedded SQLite FTS5 search & FastMCP v2 for Cursor, Claude Code & 14+ agent harnesses.
          </p>
        </div>

        {/* Live Metrics Chips */}
        <div style={{ display: "flex", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              padding: "16px 24px",
            }}
          >
            <span style={{ fontSize: "32px", fontWeight: 700, color: "#f59e0b" }}>
              {STATS.testsPassing}+
            </span>
            <span style={{ fontSize: "14px", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Tests Passing
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              padding: "16px 24px",
            }}
          >
            <span style={{ fontSize: "32px", fontWeight: 700, color: "#f4f4f5" }}>
              {STATS.mcpTools} Tools
            </span>
            <span style={{ fontSize: "14px", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              FastMCP v2 Stdio
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              padding: "16px 24px",
            }}
          >
            <span style={{ fontSize: "32px", fontWeight: 700, color: "#f4f4f5" }}>
              {STATS.agentsShipped} Agents
            </span>
            <span style={{ fontSize: "14px", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Harnesses Supported
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              padding: "16px 24px",
            }}
          >
            <span style={{ fontSize: "32px", fontWeight: 700, color: "#10b981" }}>
              ~{STATS.reductionPct}%
            </span>
            <span style={{ fontSize: "14px", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Token Reduction
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
