"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ScanLine } from "lucide-react"

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  placeholder?: string
}

export function BarcodeScanner({ onScan, placeholder = "Enter or scan barcode..." }: BarcodeScannerProps) {
  const [value, setValue] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      onScan(value.trim())
      setValue("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <ScanLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="pl-10 bg-secondary"
        />
      </div>
      <Button type="submit" variant="secondary">
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
    </form>
  )
}
