// components/Layout.tsx
"use client";

import Sidebar from "@/components/sidebar";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
  },
  main: {
    flex: 1,
    padding: "20px",
  },
};
