import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import './MiniChart.css';

interface MiniChartProps {
  data: number[];
  isPositive: boolean;
}

export const MiniChart: React.FC<MiniChartProps> = ({ data, isPositive }) => {
  const chartData = data.map((value, index) => ({ value, index }));

  // Debug: Log if data looks suspicious
  if (data.length > 0 && data.every(v => v === data[0])) {
    console.log('Chart data appears flat:', data);
  }

  // Determine stroke color based on trend
  const strokeColor = isPositive ? '#5D8A66' : '#A85C5C';

  return (
    <div className="mini-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
