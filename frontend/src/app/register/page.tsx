"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { registerUser } from "../actions/auth";
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from "react-toastify";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const decoded: { exp: number } = jwtDecode(token);
      if (decoded.exp > Date.now() / 1000) {
        router.push("/dashboard");
      } else {
        localStorage.removeItem("accessToken");
      }
    }
  }, [router]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill all required fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const user = await registerUser({ name, email, password });

    if (user?.accessToken) {
      localStorage.setItem("accessToken", user.accessToken);
      toast.success("Account created successfully!");
      router.push("/dashboard");
    }
  }

  return (
    <div style={styles.container}>
      <ToastContainer />

      {/* Soft Glow Background */}
      <div style={styles.glowTop} />
      <div style={styles.glowBottom} />

      {/* Card */}
      <div style={styles.card}>
        <Image
          src="/logo3.png"
          width={90}
          height={90}
          alt="GrowFlow"
          style={{ marginBottom: 10 }}
        />

        <h1 style={styles.heading}>Create your account</h1>
        <p style={styles.subtext}>Start your journey with GrowFlow 🌿</p>

        <form onSubmit={handleRegister} style={{ marginTop: 26 }}>
          <input
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <input
            type={showPass ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          <input
            type={showPass ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
          />

          <div style={styles.toggle} onClick={() => setShowPass(!showPass)}>
            {showPass ? "Hide password" : "Show password"}
          </div>

          <button type="submit" style={styles.button}>
            Create Account
          </button>
        </form>

        <p style={styles.loginText}>
          Already have an account?{" "}
          <span onClick={() => router.push("/login")} style={styles.loginLink}>
            Log in
          </span>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    background: "linear-gradient(135deg, #021a10, #06361f, #0c4a2a)",
    fontFamily: "'Lora','Georgia', serif",
    overflow: "hidden",
  },
  glowTop: {
    position: "absolute",
    width: 500,
    height: 500,
    background: "rgba(72, 255, 187, 0.15)",
    filter: "blur(140px)",
    top: -200,
    left: -200,
  },
  glowBottom: {
    position: "absolute",
    width: 500,
    height: 500,
    background: "rgba(80, 255, 200, 0.12)",
    filter: "blur(140px)",
    bottom: -200,
    right: -200,
  },
  card: {
    width: "95%",
    maxWidth: 460,
    background: "rgba(12, 42, 29, 0.92)",
    padding: "42px 38px",
    borderRadius: 24,
    boxShadow: "0px 30px 60px rgba(0,0,0,0.6)",
    backdropFilter: "blur(16px)",
    textAlign: "center",
    zIndex: 2,
    border: "1px solid rgba(255,255,255,0.03)",
  },
  heading: {
    fontSize: "2.2rem",
    color: "#c7ffdc",
    fontWeight: 700,
  },
  subtext: {
    marginTop: 8,
    color: "#97eec3",
    fontSize: "1.05rem",
  },
  toggle: {
    marginTop: 12,
    color: "#9dffd2",
    fontWeight: 600,
    fontSize: "0.95rem",
    cursor: "pointer",
  },
  loginText: {
    marginTop: 26,
    color: "#b6f7d9",
    fontSize: "1rem",
  },
  loginLink: {
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "underline",
  },
  button: {
    marginTop: 28,
    width: "100%",
    padding: "15px",
    background: "linear-gradient(145deg,#1fbf75,#108a54)",
    borderRadius: 15,
    fontSize: "1.15rem",
    color: "#021614",
    fontWeight: 800,
    cursor: "pointer",
    border: "none",
    boxShadow: "0px 12px 30px rgba(0,0,0,0.5)",
  },
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "15px 16px",
  marginBottom: 16,
  borderRadius: 14,
  border: "1px solid rgba(160,255,200,0.15)",
  fontSize: "1.05rem",
  outline: "none",
  background: "rgba(4, 30, 20, 0.85)",
  color: "#d6ffec",
};
