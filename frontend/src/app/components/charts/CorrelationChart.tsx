"use client";

import { Line } from "react-chartjs-2";
import "./chartSetup";

type CorrelationProps = {
  labels: string[]; // Dates (e.g., ["Mon", "Tue", "Wed"])
  habitData: number[]; // Number of habits done
  moodData: number[]; // Mood scores (1-10)
};

export default function CorrelationChart({ labels, habitData, moodData }: CorrelationProps) {
  const data = {
    labels,
    datasets: [
      {
        label: "Habits Completed",
        data: habitData,
        borderColor: "#4CAF50", // Green
        backgroundColor: "rgba(76, 175, 80, 0.2)",
        tension: 0.3,
      },
      {
        label: "Mood Score",
        data: moodData,
        borderColor: "#FFCE56", // Yellow/Gold
        backgroundColor: "rgba(255, 206, 86, 0.2)",
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 10, // Since mood is 1-10
      },
    },
  };

  return <Line data={data} options={options} />;
}