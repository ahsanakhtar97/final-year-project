"use client";

import { Pie } from "react-chartjs-2";
import "./chartSetup"; // make sure path is correct

type PieChartProps = {
  labels: string[];
  values: number[];
};

export default function PieChart({ labels, values }: PieChartProps) {
  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4CAF50"],
        borderWidth: 1,
      },
    ],
  };

  return <Pie data={data} />;
}
