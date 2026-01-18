"use client";

import { useState, useTransition } from "react";
import { TicketTrendsChart } from "./ticket-trends-chart";
import { getTicketTrends } from "@/lib/actions/tickets";

interface TicketTrendsWrapperProps {
  initialData: Array<{
    period: string;
    received: number;
    resolved: number;
  }>;
  initialPeriod: "daily" | "weekly" | "monthly" | "yearly";
}

export function TicketTrendsWrapper({
  initialData,
  initialPeriod,
}: TicketTrendsWrapperProps) {
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  const handlePeriodChange = (
    period: "daily" | "weekly" | "monthly" | "yearly",
  ) => {
    startTransition(async () => {
      const newData = await getTicketTrends(period);
      setData(newData);
    });
  };

  return (
    <TicketTrendsChart
      initialData={data}
      initialPeriod={initialPeriod}
      onPeriodChange={handlePeriodChange}
    />
  );
}
