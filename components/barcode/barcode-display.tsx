"use client"

import { useEffect, useRef } from "react"
import QRCode from "qrcode"

interface BarcodeDisplayProps {
  value: string
  type?: "qr" | "text"
  size?: number
}

export function BarcodeDisplay({ value, type = "qr", size = 100 }: BarcodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (type === "qr" && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 1,
        color: {
          dark: "#ffffff",
          light: "#00000000",
        },
      })
    }
  }, [value, type, size])

  if (type === "text") {
    return <div className="font-mono text-sm bg-secondary px-3 py-1.5 rounded border">{value}</div>
  }

  return (
    <div className="inline-flex items-center justify-center bg-secondary rounded-lg p-2">
      <canvas ref={canvasRef} />
    </div>
  )
}
