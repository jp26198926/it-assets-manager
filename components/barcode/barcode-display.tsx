"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

interface BarcodeDisplayProps {
  value: string;
  type?: "qr" | "text";
  size?: number;
}

export function BarcodeDisplay({
  value,
  type = "qr",
  size = 100,
}: BarcodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrColor, setQrColor] = useState("#ffffff");

  const getQRColor = () => {
    // Get the background color from CSS variables
    const rootStyles = getComputedStyle(document.documentElement);
    const backgroundColor = rootStyles.getPropertyValue("--background").trim();

    // Check background lightness to determine QR code color
    // OKLCH format: oklch(L C H)
    if (backgroundColor.includes("oklch")) {
      const match = backgroundColor.match(/oklch\(([\d.]+)/);
      if (match) {
        const lightness = parseFloat(match[1]);
        // If background is dark (low lightness < 0.5), use white QR code
        // If background is light (high lightness > 0.5), use black QR code
        return lightness < 0.5 ? "#ffffff" : "#000000";
      }
    }

    // Default to white
    return "#ffffff";
  };

  const generateQRCode = () => {
    if (type === "qr" && canvasRef.current) {
      const color = getQRColor();
      setQrColor(color);

      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 1,
        color: {
          dark: color,
          light: "#00000000", // Transparent background
        },
      }).catch((err) => {
        console.error("QR Code generation error:", err);
      });
    }
  };

  useEffect(() => {
    generateQRCode();

    // Listen for theme updates
    const handleThemeUpdate = () => {
      // Small delay to ensure CSS variables are updated
      setTimeout(generateQRCode, 50);
    };

    window.addEventListener("theme-updated", handleThemeUpdate);

    return () => {
      window.removeEventListener("theme-updated", handleThemeUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, type, size]);

  if (type === "text") {
    return (
      <div className="font-mono text-sm bg-secondary px-3 py-1.5 rounded border">
        {value}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center justify-center bg-secondary rounded-lg p-2">
      <canvas ref={canvasRef} />
    </div>
  );
}
