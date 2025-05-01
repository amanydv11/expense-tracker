import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = {
  food: '#FF6B6B',
  transportation: '#4ECDC4',
  shopping: '#FFD93D',
  entertainment: '#95E1D3',
  other: '#6C5CE7'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg">
        <p className="font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: ${entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function MonthlyExpenseChart({ data }) {
  // Transform data for stacked bar chart
  const transformedData = data.map(month => {
    const result = { month: month.month };
    month.categories.forEach(cat => {
      result[cat.name] = cat.amount;
    });
    return result;
  });

  const categories = Object.keys(COLORS);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Expenses by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={transformedData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {categories.map((category) => (
                <Bar
                  key={category}
                  dataKey={category}
                  stackId="a"
                  fill={COLORS[category]}
                  name={category.charAt(0).toUpperCase() + category.slice(1)}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 