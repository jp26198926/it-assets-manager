"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface TicketTrendsChartProps {
  initialData: Array<{
    period: string;
    received: number;
    resolved: number;
  }>;
  initialPeriod: "daily" | "weekly" | "monthly" | "yearly";
  onPeriodChange: (period: "daily" | "weekly" | "monthly" | "yearly") => void;
}

export function TicketTrendsChart({
  initialData,
  initialPeriod,
  onPeriodChange,
}: TicketTrendsChartProps) {
  const [period, setPeriod] = useState(initialPeriod);

  const handlePeriodChange = (value: string) => {
    const newPeriod = value as "daily" | "weekly" | "monthly" | "yearly";
    setPeriod(newPeriod);
    onPeriodChange(newPeriod);
  };

  return (
    <Card className="bg-card border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ticket Trends
          </CardTitle>
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[140px] bg-secondary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {initialData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={initialData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="period"
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
              />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#141414",
                  border: "1px solid #27272a",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fafafa" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="received"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 4 }}
                activeDot={{ r: 6 }}
                name="Tickets Received"
              />
              <Line
                type="monotone"
                dataKey="resolved"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: "#22c55e", r: 4 }}
                activeDot={{ r: 6 }}
                name="Tickets Resolved"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No trend data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
