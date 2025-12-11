"use client";

import { createContext, useContext, useEffect, useState } from "react";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const saved = localStorage.getItem("global_theme");
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("global_theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <html lang="en">
      <body className={`${theme === "dark" ? "dark" : ""}`}>
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
          {children}

          {/* ToastContainer positioned top-right */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme={theme === "dark" ? "dark" : "light"}
          />
        </ThemeContext.Provider>
      </body>
    </html>
  );
}
