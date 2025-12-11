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

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [image, setImage] = useState("/default-avatar.png");
  const [userId, setUserId] = useState(0);

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
      await deleteUser(userId); // make sure you implement this API call
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
      className="
        min-h-screen w-full p-8 
        bg-gradient-to-br from-[#0d2619] via-[#0f3d26] to-[#0b1f16]
        text-[#d4f3e0]
      "
    >
      <h1 className="text-4xl font-bold mb-10 text-[#c8fadd]">
        Profile Settings
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT SIDEBAR */}
        <Card
          className="
          col-span-1
          rounded-2xl 
          bg-[#0d281b]/60 
          backdrop-blur-md 
          border border-[#1f4d33]
          shadow-xl shadow-[#0f381f]/40
        "
        >
          <CardHeader>
            <CardTitle className="text-[#c8fadd] tracking-wide">
              Your Profile
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col items-center space-y-5">
            <Avatar className="h-28 w-28 shadow-md shadow-[#193b29]">
              <AvatarImage src={image} />
              <AvatarFallback>AA</AvatarFallback>
            </Avatar>

            <Button
              className="
                w-full 
                bg-gradient-to-r from-[#0f7a45] to-[#0c5c34] 
                hover:from-[#0c5c34] hover:to-[#094828]
                text-white font-semibold rounded-xl
              "
              onClick={() => toast.info("Image upload not implemented yet")}
            >
              Change Profile Image
            </Button>

            <div className="w-full mt-3 space-y-3">
              <p className="font-semibold text-[#bff2d6]">Account Status:</p>
              <p className="text-sm text-[#9ed8bb]">Active</p>

              <p className="font-semibold text-[#bff2d6] mt-3">Joined:</p>
              <p className="text-sm text-[#9ed8bb]">12 March 2024</p>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT EDIT SECTION */}
        <Card
          className="
          col-span-2 
          rounded-2xl 
          bg-[#0d281b]/60 
          backdrop-blur-md 
          border border-[#1f4d33]
          shadow-xl shadow-[#0f381f]/40
        "
        >
          <CardHeader>
            <CardTitle className="text-[#c8fadd] tracking-wide">
              Edit Information
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* NAME */}
            <div className="space-y-2">
              <Label className="text-[#bff2d6]">Full Name</Label>
              <Input
                className="
                  bg-[#0b1f16] 
                  border border-[#1f4d33] 
                  focus:border-[#2bb673]
                  text-white
                "
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <Label className="text-[#bff2d6]">Email Address</Label>
              <Input
                type="email"
                className="
                  bg-[#0b1f16] 
                  border border-[#1f4d33]
                  focus:border-[#2bb673]
                  text-white
                "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label className="text-[#bff2d6]">New Password</Label>
              <Input
                type="password"
                className="
                  bg-[#0b1f16] 
                  border border-[#1f4d33] 
                  focus:border-[#2bb673]
                  text-white
                "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* CONFIRM PASSWORD */}
            {password && (
              <div className="space-y-2">
                <Label className="text-[#bff2d6]">Confirm Password</Label>
                <Input
                  type="password"
                  className="
                    bg-[#0b1f16] 
                    border border-[#1f4d33] 
                    focus:border-[#2bb673]
                    text-white
                  "
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            <Button
              onClick={handleSave}
              className="
                w-full 
                bg-gradient-to-r from-[#0f7a45] to-[#0c5c34] 
                hover:from-[#0c5c34] hover:to-[#094828]
                text-white font-semibold rounded-xl
                py-6
                text-lg
              "
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
