"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  User,
  MessageSquare,
  BarChart2,
  Mail,
  Settings,
  MoreHorizontal,
  LogOut
} from "lucide-react";
import Link from "next/link";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Profile", icon: User, href: "/dashboard/profile" },
  { name: "Comments", icon: MessageSquare, href: "/dashboard/comments" },
  { name: "Analytics", icon: BarChart2, href: "/dashboard/analytics" },
  { name: "Messages", icon: Mail, href: "/dashboard/messages" },
  { name: "Integration", icon: Mail, href: "/dashboard/integration" },
];

export default function Sidebar() {
  const [open, setOpen] = useState(true);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden p-3"
        onClick={() => setOpen(!open)}
      >
        ☰
      </button>

      <div
        className={`bg-white shadow-md h-screen p-6 flex flex-col w-64 
        md:translate-x-0 transition-all duration-300 fixed md:static 
        ${open ? "translate-x-0" : "-translate-x-64"}
        `}
      >
        <h1 className="text-xl font-bold mb-10">Virtual Dashboard</h1>

        {/* Main Menu */}
        <nav className="space-y-3 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-md hover:bg-blue-100"
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Section divider */}
          <div className="border-t my-4"></div>

          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 p-3 rounded-md hover:bg-blue-100"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>

          <Link
            href="#"
            className="flex items-center gap-3 p-3 rounded-md hover:bg-blue-100"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span>More</span>
          </Link>
        </nav>

        {/* Logout */}
        <button className="mt-auto flex items-center gap-3 p-3 rounded-md border hover:bg-gray-100">
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>
    </>
  );
}
