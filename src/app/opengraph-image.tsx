import { ImageResponse } from "next/og";

export const alt =
  "VoiceOrbs, an open-source gallery of animated orbs for AI assistants";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 96,
          backgroundColor: "#070811",
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 340,
            height: 340,
            borderRadius: 340,
            display: "flex",
            backgroundImage:
              "radial-gradient(circle at 32% 28%, #c7d2fe 0%, #818cf8 28%, #6366f1 52%, #22d3ee 88%, #0e7490 100%)",
            boxShadow:
              "0 0 120px 30px rgba(99,102,241,0.45), 0 0 260px 80px rgba(34,211,238,0.18)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 560,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#f4f5fb",
              lineHeight: 1.1,
              letterSpacing: -2,
            }}
          >
            VoiceOrbs
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 32,
              color: "#9aa1c2",
              lineHeight: 1.4,
            }}
          >
            Open-source copy-paste gallery of animated orbs for conversational
            AI assistants
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
