"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface DashboardChartsProps {
  inventoryStats: {
    total: number
    inStock: number
    issued: number
    underRepair: number
    beyondRepair: number
  }
  ticketStats: {
    total: number
    open: number
    inProgress: number
    resolved: number
    closed: number
  }
}

const INVENTORY_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"]
const TICKET_COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#6b7280"]

export function DashboardCharts({ inventoryStats, ticketStats }: DashboardChartsProps) {
  const inventoryData = [
    { name: "In Stock", value: inventoryStats.inStock },
    { name: "Issued", value: inventoryStats.issued },
    { name: "Under Repair", value: inventoryStats.underRepair },
    { name: "Beyond Repair", value: inventoryStats.beyondRepair },
  ].filter((item) => item.value > 0)

  const ticketData = [
    { name: "Open", value: ticketStats.open },
    { name: "In Progress", value: ticketStats.inProgress },
    { name: "Resolved", value: ticketStats.resolved },
    { name: "Closed", value: ticketStats.closed },
  ].filter((item) => item.value > 0)

  return (
    <Card className="bg-card border">
      <CardHeader>
        <CardTitle className="text-lg">Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground text-center mb-4">Inventory Status</p>
            {inventoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={inventoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {inventoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={INVENTORY_COLORS[index % INVENTORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141414",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">No inventory data</div>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground text-center mb-4">Ticket Status</p>
            {ticketData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={ticketData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {ticketData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={TICKET_COLORS[index % TICKET_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141414",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">No ticket data</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
