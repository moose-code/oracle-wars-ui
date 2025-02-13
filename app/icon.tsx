import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "rotate(45deg)",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            background: "linear-gradient(to right top, #3b82f6, #2563eb)",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              background: "#ffffff",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                transform: "rotate(-45deg)",
                color: "#3b82f6",
                fontSize: "16px",
                fontWeight: 700,
                fontFamily: "sans-serif",
              }}
            >
              O
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
