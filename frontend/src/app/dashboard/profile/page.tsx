"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import { deleteUser, updateUser } from "@/app/actions/getUsers";
import { UpdateUserPayload } from "@/types/users";
import { useRouter } from "next/navigation";
// 1. IMPORT useTheme from the layout file (assuming same path as to-do/dashboard)
import { useTheme } from "@/app/dashboard/layout"; 

// --- Theme Classes Definition ---
// Define classes for Light and Dark modes to switch dynamically
const ThemeClasses = {
    // Page Background and Text
    page: {
        dark: "bg-gradient-to-br from-[#0d2619] via-[#0f3d26] to-[#0b1f16] text-[#d4f3e0]",
        light: "bg-gradient-to-br from-[#f0f9f3] via-[#e5f5e8] to-[#dff8e3] text-[#163b25]",
    },
    // Main Heading Accent
    heading: {
        dark: "text-[#c8fadd]",
        light: "text-[#163b25]",
    },
    // Standard Card (Left and Right panels)
    card: {
        dark: "bg-[#0d281b]/60 border border-[#1f4d33] shadow-xl shadow-[#0f381f]/40",
        light: "bg-white/80 border border-[#d2e8d9] shadow-md shadow-[#bfe7c5]/40",
    },
    // Card Text
    cardTitle: {
        dark: "text-[#c8fadd]",
        light: "text-[#163b25]",
    },
    // Input Fields
    input: {
        dark: "bg-[#0b1f16] border border-[#1f4d33] focus:border-[#2bb673] text-white placeholder:text-gray-500",
        light: "bg-white border border-[#c4e1cc] focus:border-[#2bb673] text-[#163b25]",
    },
    // Input/Label Secondary Text
    label: {
        dark: "text-[#bff2d6]",
        light: "text-[#163b25]",
    },
    // Primary Button (Save/Change Image)
    primaryBtn: {
        dark: "bg-gradient-to-r from-[#0f7a45] to-[#0c5c34] hover:from-[#0c5c34] hover:to-[#094828] text-white",
        light: "bg-gradient-to-r from-[#2bb673] to-[#1f8c5c] hover:from-[#1f8c5c] hover:to-[#163b25] text-white",
    },
};
// --- End Theme Classes Definition ---


export default function ProfilePage() {
    // 2. Consume theme context
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [image, setImage] = useState("/default-avatar.png");
    const [userId, setUserId] = useState(0);

    // Helper to conditionally join classes
    const cc = (base: string, darkClass: string, lightClass: string) => {
        return `${base} ${isDark ? darkClass : lightClass}`;
    };

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            const payload: { sub: Number; name: string; email: string } =
                jwtDecode(token);

            setUserId(Number(payload.sub));
            setName(String(payload.name));
            setEmail(String(payload.email));
        }
    }, []);

    // ===============================
    // SAVE PROFILE
    // ===============================
    const handleSave = async () => {
        if (!name || !email) {
            toast.error("Name and email cannot be empty");
            return;
        }

        // Build update payload
        const data: UpdateUserPayload = {
            name,
            email,
            ...(password
                ? {
                    password,
                    confirmPassword,
                }
                : {}), // only send password IF user is updating it
        };

        try {
            const res = await updateUser(userId, data);
            localStorage.setItem('accessToken', res.accessToken);
            toast.success(res.message);

            // Reset password fields after update
            setPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error(error);

            const message =
                error?.response?.data?.message || "Failed to update profile";

            toast.error(message);
        }
    };
    
    const handleDelete = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to delete your account? This action cannot be undone."
        );

        if (!confirmed) return;

        try {
            // Call your API to delete the user
            await deleteUser(userId); 
            toast.success("Account deleted successfully!");

            // Remove token
            localStorage.removeItem("accessToken");

            // Redirect to login
            router.push("/login");
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to delete account.");
        }
    };

    return (
        <div
            className={cc(
                "min-h-screen w-full p-8",
                ThemeClasses.page.dark,
                ThemeClasses.page.light
            )}
        >
            <h1 className={cc("text-4xl font-bold mb-10", ThemeClasses.heading.dark, ThemeClasses.heading.light)}>
                Profile Settings
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT SIDEBAR */}
                <Card
                    className={cc(
                        "col-span-1 rounded-2xl backdrop-blur-md",
                        ThemeClasses.card.dark,
                        ThemeClasses.card.light
                    )}
                >
                    <CardHeader>
                        <CardTitle className={cc("tracking-wide", ThemeClasses.cardTitle.dark, ThemeClasses.cardTitle.light)}>
                            Your Profile
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="flex flex-col items-center space-y-5">
                        <Avatar className={cc("h-28 w-28 shadow-md", isDark ? "shadow-[#193b29]" : "shadow-[#cbe8d2]")}>
                            <AvatarImage src={image} />
                            <AvatarFallback>AA</AvatarFallback>
                        </Avatar>

                        <Button
                            className={cc(
                                "w-full font-semibold rounded-xl",
                                ThemeClasses.primaryBtn.dark,
                                ThemeClasses.primaryBtn.light
                            )}
                            onClick={() => toast.info("Image upload not implemented yet")}
                        >
                            Change Profile Image
                        </Button>

                        <div className="w-full mt-3 space-y-3">
                            <p className={cc("font-semibold", isDark ? "text-[#bff2d6]" : "text-[#163b25]")}>Account Status:</p>
                            <p className={cc("text-sm", isDark ? "text-[#9ed8bb]" : "text-gray-600")}>Active</p>

                            <p className={cc("font-semibold mt-3", isDark ? "text-[#bff2d6]" : "text-[#163b25]")}>Joined:</p>
                            <p className={cc("text-sm", isDark ? "text-[#9ed8bb]" : "text-gray-600")}>12 March 2024</p>
                        </div>
                    </CardContent>
                </Card>

                {/* RIGHT EDIT SECTION */}
                <Card
                    className={cc(
                        "col-span-2 rounded-2xl backdrop-blur-md",
                        ThemeClasses.card.dark,
                        ThemeClasses.card.light
                    )}
                >
                    <CardHeader>
                        <CardTitle className={cc("tracking-wide", ThemeClasses.cardTitle.dark, ThemeClasses.cardTitle.light)}>
                            Edit Information
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* NAME */}
                        <div className="space-y-2">
                            <Label className={cc("", ThemeClasses.label.dark, ThemeClasses.label.light)}>Full Name</Label>
                            <Input
                                className={cc("", ThemeClasses.input.dark, ThemeClasses.input.light)}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        {/* EMAIL */}
                        <div className="space-y-2">
                            <Label className={cc("", ThemeClasses.label.dark, ThemeClasses.label.light)}>Email Address</Label>
                            <Input
                                type="email"
                                className={cc("", ThemeClasses.input.dark, ThemeClasses.input.light)}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {/* PASSWORD */}
                        <div className="space-y-2">
                            <Label className={cc("", ThemeClasses.label.dark, ThemeClasses.label.light)}>New Password</Label>
                            <Input
                                type="password"
                                className={cc("", ThemeClasses.input.dark, ThemeClasses.input.light)}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {/* CONFIRM PASSWORD */}
                        {password && (
                            <div className="space-y-2">
                                <Label className={cc("", ThemeClasses.label.dark, ThemeClasses.label.light)}>Confirm Password</Label>
                                <Input
                                    type="password"
                                    className={cc("", ThemeClasses.input.dark, ThemeClasses.input.light)}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        )}

                        <Button
                            onClick={handleSave}
                            className={cc(
                                "w-full py-6 text-lg font-semibold rounded-xl",
                                ThemeClasses.primaryBtn.dark,
                                ThemeClasses.primaryBtn.light
                            )}
                        >
                            Save Changes
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* DANGER ZONE */}
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
                        Deleting your account is permanent and cannot be undone.
                    </p>

                    <Button
                        variant="destructive"
                        className="w-full py-6 text-lg rounded-xl"
                        onClick={handleDelete}
                    >
                        Delete Account
                    </Button>

                </CardContent>
            </Card>
        </div>
    );
}