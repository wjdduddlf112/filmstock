import { ImageResponse } from "next/og";
export const alt = "FILM STOCK - A personal cinema archive";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        background: "#151515",
        color: "#f5f5f3",
        padding: 80,
        borderLeft: "16px solid #dc313a",
      }}
    >
      <div style={{ fontSize: 24, color: "#bbb" }}>
        A PERSONAL CINEMA ARCHIVE
      </div>
      <div style={{ fontSize: 104, fontWeight: 700, display: "flex" }}>
        FILM STOCK<span style={{ color: "#dc313a" }}>.</span>
      </div>
      <div style={{ fontSize: 26 }}>Films. Notes. Lasting impressions.</div>
    </div>,
    size,
  );
}
