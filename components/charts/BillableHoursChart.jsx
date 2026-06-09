"use client"

import * as React from "react"
import { Pie, PieChart, Cell, Legend, ResponsiveContainer } from "recharts"

const COLORS = {
  billable: '#10b981',    // Emerald green
  nonBillable: '#f59e0b'  // Amber orange
};

const BillableHoursChart = ({ billable, nonBillable }) => {
  const billableValue = parseFloat(billable) || 0;
  const nonBillableValue = parseFloat(nonBillable) || 0;
  const totalHours = billableValue + nonBillableValue;

  // If no data, show placeholder data for visualization
  const chartData = totalHours > 0 ? [
    { name: "Billable Hours", value: billableValue, color: COLORS.billable },
    { name: "Non-Billable Hours", value: nonBillableValue, color: COLORS.nonBillable },
  ].filter(item => item.value > 0) : [
    { name: "No Data", value: 1, color: '#e5e7eb' }
  ];

  // Custom label to show percentage
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (totalHours === 0) return null; // Don't show label when no data
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-bold text-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom legend
  const renderLegend = (props) => {
    const { payload } = props;
    
    if (totalHours === 0) {
      return null; // Don't show legend when no data
    }
    
    return (
      <div className="flex justify-center gap-6 mt-4">
        {payload.map((entry, index) => {
          const dataItem = chartData.find(d => d.name === entry.value);
          if (!dataItem || dataItem.value === 0) return null;
          
          return (
            <div key={`legend-${index}`} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium">
                {entry.value}: {dataItem.value.toFixed(2)}h
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full">
      {totalHours === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-48 h-48 rounded-full bg-muted flex items-center justify-center mb-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-muted-foreground">0h</p>
              <p className="text-sm text-muted-foreground mt-2">No Data</p>
            </div>
          </div>
          <p className="text-muted-foreground">No hours logged yet. Start tracking your time!</p>
        </div>
      ) : (
        <>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend content={renderLegend} verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="text-center mt-4 pb-4">
            <p className="text-3xl font-bold">{totalHours.toFixed(2)}h</p>
            <p className="text-sm text-muted-foreground">Total Hours Logged</p>
          </div>
        </>
      )}
    </div>
  )
}

export default BillableHoursChart;
