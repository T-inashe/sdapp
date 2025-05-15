// components/StatusPieChart.tsx
import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { StatusData } from "../types/milestone";

ChartJS.register(ArcElement, Tooltip, Legend);

interface StatusPieChartProps {
  data: StatusData;
}

const StatusPieChart: React.FC<StatusPieChartProps> = ({ data }) => {
  const chartData = {
    labels: ["Completed", "In Progress", "Not Started"],
    datasets: [
      {
        data: [data.completed, data.inProgress, data.notStarted],
        backgroundColor: ["#4CAF50", "#FFC107", "#F44336"],
      },
    ],
  };

  return <Pie data={chartData} />;
};

export default StatusPieChart;