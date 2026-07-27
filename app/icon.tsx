import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 112,
        background: "linear-gradient(145deg, #07182b 0%, #123d68 52%, #0f766e 100%)",
        color: "white",
        fontSize: 244,
        fontWeight: 900,
        letterSpacing: 0,
        boxShadow: "inset 0 0 0 12px rgba(165,243,252,0.32)",
      }}
    >
      L
    </div>,
    size
  );
}
