import React, { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import './MiniChart.css';

interface MiniChartProps {
  data: number[];
  isPositive: boolean;
}

export const MiniChart: React.FC<MiniChartProps> = ({ data, isPositive }) => {
  // Memoize chart data to prevent unnecessary re-renders
  const chartData = useMemo(() => {
    return data.map((value, index) => ({ value, index }));
  }, [data]);

  // Check if we have valid data (not all zeros)
  const hasValidData = useMemo(() => {
    return data.length > 0 && data.some((v) => v > 0);
  }, [data]);

  // Determine stroke color based on trend
  const strokeColor = isPositive ? '#5D8A66' : '#A85C5C';

  // If no valid data yet, show a placeholder line
  if (!hasValidData) {
    return (
      <div className="mini-chart mini-chart-loading">
        <div className="mini-chart-placeholder" />
      </div>
    );
  }

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
            animationDuration={300}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
