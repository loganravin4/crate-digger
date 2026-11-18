import { ImageResponse } from "next/og";

export const alt = "Crate Digger: name the record nobody else would.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const fields = ["#e4ae1f", "#bf3a22", "#2b57a6"];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#16130f", color: "#f3ecdd", padding: 64 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 2 }}>CRATE DIGGER</div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 92, fontWeight: 900, lineHeight: 0.95 }}>
            <span>NAME THE RECORD</span>
            <span>NOBODY ELSE WOULD.</span>
          </div>
          <div style={{ fontSize: 30, color: "#cfc5b1" }}>Daily music trivia. The rarest correct answer wins.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginLeft: 48 }}>
          {fields.map((c) => (
            <div key={c} style={{ width: 150, height: 150, background: c }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
