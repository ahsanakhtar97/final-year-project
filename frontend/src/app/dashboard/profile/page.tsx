"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "react-toastify";
import {
  deleteUser,
  getUser,
  updateUser,
} from "@/app/actions/getUsers";
import { UpdateUserPayload, User } from "@/types/users";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/dashboard/theme-context";
import { getCurrentUser, clearAuth } from "@/lib/auth";
import { getJournalEntriesByUser } from "@/app/actions/journal";
import { getTasks } from "@/app/actions/tasks";
import { getHabitsByUserId } from "@/app/actions/user-habits";

// --- Theme Classes ---
const T = {
  page: {
    dark: "bg-gradient-to-br from-[#0d2619] via-[#0f3d26] to-[#0b1f16] text-[#d4f3e0]",
    light: "bg-gradient-to-br from-[#f0f9f3] via-[#e5f5e8] to-[#dff8e3] text-[#163b25]",
  },
  heading: { dark: "text-[#c8fadd]", light: "text-[#163b25]" },
  card: {
    dark: "bg-[#0d281b]/60 border border-[#1f4d33] shadow-xl shadow-[#0f381f]/40",
    light: "bg-white/80 border border-[#d2e8d9] shadow-md shadow-[#bfe7c5]/40",
  },
  cardTitle: { dark: "text-[#c8fadd]", light: "text-[#163b25]" },
  input: {
    dark: "bg-[#0b1f16] border border-[#1f4d33] focus:border-[#2bb673] text-white placeholder:text-gray-500",
    light: "bg-white border border-[#c4e1cc] focus:border-[#2bb673] text-[#163b25]",
  },
  label: { dark: "text-[#bff2d6]", light: "text-[#163b25]" },
  primaryBtn: {
    dark: "bg-gradient-to-r from-[#0f7a45] to-[#0c5c34] hover:from-[#0c5c34] hover:to-[#094828] text-white",
    light: "bg-gradient-to-r from-[#2bb673] to-[#1f8c5c] hover:from-[#1f8c5c] hover:to-[#163b25] text-white",
  },
};

function initialsFor(name: string): string {
  if (!name) return "GF";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "GF";
}

function formatJoined(iso?: string | null): string {
  if (!iso) return "\u2014";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "\u2014";
  }
}

export default function ProfilePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [image] = useState("/default-avatar.png");
  const [userId, setUserId] = useState(0);
  const [serverUser, setServerUser] = useState<User | null>(null);
  const [stats, setStats] = useState<{
    journalEntries: number;
    tasksCompleted: number;
    activeHabits: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const cc = (base: string, dark: string, light?: string) => {
    if (light === undefined) return `${base} ${dark}`;
    return `${base} ${isDark ? dark : light}`;
  };

  const initials = useMemo(() => initialsFor(name), [name]);

  // Hydrate from JWT, then enrich with server-side user + stats.
  useEffect(() => {
    const me = getCurrentUser();
    if (!me) return;
    setUserId(me.userId);
    setName(me.name);
    setEmail(me.email);

    let cancelled = false;
    (async () => {
      try {
        const [user, journal, tasks, userHabits] = await Promise.all([
          getUser(me.userId).catch(() => null),
          getJournalEntriesByUser(me.userId).catch(() => []),
          getTasks().catch(() => []),
          getHabitsByUserId(me.userId).catch(() => []),
        ]);
        if (cancelled) return;
        if (user) setServerUser(user);
        setStats({
          journalEntries: journal.length,
          tasksCompleted: tasks.filter(
            (t) => t.taskStatus === "completed",
          ).length,
          activeHabits: userHabits.length,
        });
      } catch {
        // non-fatal -- the page still works without stats.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email cannot be empty.");
      return;
    }
    if (password && password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password && password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    const data: UpdateUserPayload = {
      name: name.trim(),
      email: email.trim(),
      ...(password ? { password, confirmPassword } : {}),
    };

    setSaving(true);
    try {
      const res = await updateUser(userId, data);
      // Backend returns a refreshed JWT -- keep it so name/email changes
      // are reflected everywhere that reads from the token.
      const refreshed = res as unknown as {
        accessToken?: string;
        message?: string;
      };
      if (refreshed.accessToken) {
        localStorage.setItem("accessToken", refreshed.accessToken);
      }
      toast.success(refreshed.message ?? "Profile updated.");
      setPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string | string[] } };
      };
      const raw = err?.response?.data?.message;
      const message = Array.isArray(raw) ? raw.join(", ") : raw;
      toast.error(message ?? "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This cannot be undone.",
    );
    if (!confirmed) return;
    try {
      await deleteUser(userId);
      toast.success("Account deleted.");
      clearAuth();
      router.push("/login");
    } catch {
      toast.error("Failed to delete account.");
    }
  };

  const joinedLabel = formatJoined(serverUser?.createdAt);

  return (
    <div className="mx-auto max-w-5xl gf-fade-up">
      <div className="mb-8">
        <h1
          className={cc("gf-h1", T.heading.dark, T.heading.light)}
          style={{ fontFamily: "'Lora', serif" }}
        >
          Profile Settings
        </h1>
        <p className="gf-muted mt-1 text-sm">
          Manage your account details, security, and see your activity at a
          glance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT SIDEBAR */}
        <Card
          className={cc(
            "col-span-1 rounded-2xl backdrop-blur-md",
            T.card.dark,
            T.card.light,
          )}
        >
          <CardHeader>
            <CardTitle
              className={cc(
                "tracking-wide",
                T.cardTitle.dark,
                T.cardTitle.light,
              )}
            >
              Your Profile
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col items-center space-y-5">
            <Avatar
              className={cc(
                "h-28 w-28 shadow-md",
                isDark ? "shadow-[#193b29]" : "shadow-[#cbe8d2]",
              )}
            >
              <AvatarImage src={image} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <Button
              className={cc(
                "w-full font-semibold rounded-xl",
                T.primaryBtn.dark,
                T.primaryBtn.light,
              )}
              onClick={() =>
                toast.info("Image upload is coming soon -- using initials for now.")
              }
            >
              Change Profile Image
            </Button>

            <div className="w-full mt-3 space-y-3">
              <p
                className={cc(
                  "font-semibold",
                  isDark ? "text-[#bff2d6]" : "text-[#163b25]",
                )}
              >
                Account Status:
              </p>
              <p
                className={cc(
                  "text-sm",
                  isDark ? "text-[#9ed8bb]" : "text-gray-600",
                )}
              >
                Active
              </p>

              <p
                className={cc(
                  "font-semibold mt-3",
                  isDark ? "text-[#bff2d6]" : "text-[#163b25]",
                )}
              >
                Joined:
              </p>
              <p
                className={cc(
                  "text-sm",
                  isDark ? "text-[#9ed8bb]" : "text-gray-600",
                )}
              >
                {joinedLabel}
              </p>

              {stats && (
                <>
                  <p
                    className={cc(
                      "font-semibold mt-3",
                      isDark ? "text-[#bff2d6]" : "text-[#163b25]",
                    )}
                  >
                    Activity:
                  </p>
                  <ul
                    className={cc(
                      "text-sm space-y-1",
                      isDark ? "text-[#9ed8bb]" : "text-gray-600",
                    )}
                  >
                    <li>{stats.journalEntries} journal entries</li>
                    <li>{stats.tasksCompleted} tasks completed</li>
                    <li>{stats.activeHabits} active habits</li>
                  </ul>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT EDIT SECTION */}
        <Card
          className={cc(
            "col-span-2 rounded-2xl backdrop-blur-md",
            T.card.dark,
            T.card.light,
          )}
        >
          <CardHeader>
            <CardTitle
              className={cc(
                "tracking-wide",
                T.cardTitle.dark,
                T.cardTitle.light,
              )}
            >
              Edit Information
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className={cc("", T.label.dark, T.label.light)}>
                Full Name
              </Label>
              <Input
                className={cc("", T.input.dark, T.input.light)}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className={cc("", T.label.dark, T.label.light)}>
                Email Address
              </Label>
              <Input
                type="email"
                className={cc("", T.input.dark, T.input.light)}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className={cc("", T.label.dark, T.label.light)}>
                New Password
              </Label>
              <Input
                type="password"
                placeholder="Leave blank to keep current password"
                className={cc("", T.input.dark, T.input.light)}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {password && (
              <div className="space-y-2">
                <Label className={cc("", T.label.dark, T.label.light)}>
                  Confirm Password
                </Label>
                <Input
                  type="password"
                  className={cc("", T.input.dark, T.input.light)}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={saving}
              className={cc(
                "w-full py-6 text-lg font-semibold rounded-xl",
                T.primaryBtn.dark,
                T.primaryBtn.light,
              )}
            >
              {saving ? "Saving\u2026" : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card
        className="
          mt-10
          rounded-2xl
          bg-[#300f0f]/60
          backdrop-blur-md
          border border-red-900
          shadow-xl shadow-red-950/40
          "
      >
        <CardHeader>
          <CardTitle className="text-red-300 tracking-wide">
            Danger Zone
          </CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-red-200 mb-4">
            Deleting your account is permanent and cannot be undone. All your
            tasks, habits, and journal entries will be removed.
          </p>

          <Button
            variant="destructive"
            className="w-full py-6 text-lg font-semibold rounded-xl bg-red-700 hover:bg-red-800 text-white"
            onClick={handleDelete}
          >
            Delete My Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
