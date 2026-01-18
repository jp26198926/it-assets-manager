"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateThemeSettings } from "@/lib/actions/settings";
import { updateAppTheme } from "@/components/theme-provider";
import type {
  AppSettingsSerialized,
  ThemeColor,
  BackgroundColor,
} from "@/lib/models/types";
import { Loader2, Palette, Check } from "lucide-react";

interface ThemeSettingsFormProps {
  settings: AppSettingsSerialized;
  currentUser?: { name: string };
}

const themeColors: { value: ThemeColor; label: string; class: string }[] = [
  { value: "zinc", label: "Zinc", class: "bg-zinc-500" },
  { value: "slate", label: "Slate", class: "bg-slate-500" },
  { value: "stone", label: "Stone", class: "bg-stone-500" },
  { value: "gray", label: "Gray", class: "bg-gray-500" },
  { value: "neutral", label: "Neutral", class: "bg-neutral-500" },
  { value: "red", label: "Red", class: "bg-red-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "amber", label: "Amber", class: "bg-amber-500" },
  { value: "yellow", label: "Yellow", class: "bg-yellow-500" },
  { value: "lime", label: "Lime", class: "bg-lime-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "emerald", label: "Emerald", class: "bg-emerald-500" },
  { value: "teal", label: "Teal", class: "bg-teal-500" },
  { value: "cyan", label: "Cyan", class: "bg-cyan-500" },
  { value: "sky", label: "Sky", class: "bg-sky-500" },
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "indigo", label: "Indigo", class: "bg-indigo-500" },
  { value: "violet", label: "Violet", class: "bg-violet-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "fuchsia", label: "Fuchsia", class: "bg-fuchsia-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
  { value: "rose", label: "Rose", class: "bg-rose-500" },
];

const backgroundColors: {
  value: BackgroundColor;
  label: string;
  class: string;
}[] = [
  { value: "black", label: "Black", class: "bg-black" },
  { value: "dark", label: "Dark", class: "bg-zinc-900" },
  { value: "darker", label: "Darker", class: "bg-zinc-950" },
  { value: "darkest", label: "Darkest", class: "bg-black" },
  { value: "zinc", label: "Zinc", class: "bg-zinc-900" },
  { value: "slate", label: "Slate", class: "bg-slate-900" },
  { value: "gray", label: "Gray", class: "bg-gray-900" },
  { value: "white", label: "White", class: "bg-white" },
  { value: "milk", label: "Milk", class: "bg-zinc-50" },
  { value: "light-gray", label: "Light Gray", class: "bg-gray-200" },
];

export function ThemeSettingsForm({
  settings,
  currentUser,
}: ThemeSettingsFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState<ThemeColor>(
    settings.themeColor,
  );
  const [selectedBackground, setSelectedBackground] = useState<BackgroundColor>(
    settings.backgroundColor || "black",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateThemeSettings({
        themeColor: selectedColor,
        backgroundColor: selectedBackground,
        updatedBy: currentUser?.name,
      });

      if (result.success) {
        // Apply theme immediately without refresh
        updateAppTheme({
          themeColor: selectedColor,
          backgroundColor: selectedBackground,
        });

        toast({
          title: "Success",
          description: "Theme settings updated and applied successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update theme",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Settings
        </CardTitle>
        <CardDescription>
          Customize the application's color scheme
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>Primary Color</Label>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {themeColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`relative flex flex-col items-center gap-2 p-2 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedColor === color.value
                      ? "border-primary shadow-md"
                      : "border-transparent hover:border-muted-foreground/20"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full ${color.class} flex items-center justify-center`}
                  >
                    {selectedColor === color.value && (
                      <Check className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <span className="text-xs font-medium">{color.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <Label>Background Color</Label>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-5 gap-3">
              {backgroundColors.map((bg) => (
                <button
                  key={bg.value}
                  type="button"
                  onClick={() => setSelectedBackground(bg.value)}
                  className={`relative flex flex-col items-center gap-2 p-2 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedBackground === bg.value
                      ? "border-primary shadow-md"
                      : "border-transparent hover:border-muted-foreground/20"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg ${bg.class} flex items-center justify-center border border-muted-foreground/20`}
                  >
                    {selectedBackground === bg.value && (
                      <Check
                        className={`h-5 w-5 ${bg.value === "white" || bg.value === "milk" || bg.value === "light-gray" ? "text-black" : "text-white"}`}
                      />
                    )}
                  </div>
                  <span className="text-xs font-medium">{bg.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply Theme
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
