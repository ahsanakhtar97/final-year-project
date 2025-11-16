"use client";

import React from "react";
// We don't need 'next/image' for this component anymore
import styles from "./styles.module.css";

export default function LoginPage() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.loginCard}>
        {/* Left Info Panel */}
        {/* The logo is now the background of this div, set in styles.module.css */}
        <div className={styles.infoPanel}></div>

        {/* Right Form Panel */}
        <div className={styles.formPanel}>
          <h2 className={styles.loginTitle}>Log In</h2>

          <form className={styles.loginForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="username">Username/Email</label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username/email"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                required
              />
            </div>

            <a href="#" className={styles.forgotLink}>
              Forgot Password?
            </a>

            <button className={styles.loginBtn} type="submit">
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}