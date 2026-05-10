"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Mic,
  History,
  Trophy,
  BookOpen,
  TrendingUp,
  DollarSign,
  Settings,
  ChevronRight,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

const navItems = [
  {
    group: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/interview/setup", label: "Practice Interview", icon: Mic },
      { href: "/daily", label: "Daily Question", icon: BookOpen },
    ],
  },
  {
    group: "Tools",
    items: [
      { href: "/predict", label: "Predict Questions", icon: TrendingUp },
      { href: "/negotiate/setup", label: "Salary Negotiation", icon: DollarSign },
      { href: "/recordings", label: "Recordings", icon: Headphones },
    ],
  },
  {
    group: "Progress",
    items: [
      { href: "/history", label: "Session History", icon: History },
      { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    ],
  },
  {
    group: "Account",
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-60 border-r border-zinc-800 bg-zinc-950/50 backdrop-blur-sm overflow-y-auto z-40 hidden lg:flex flex-col">
      <div className="flex-1 py-4">
        {navItems.map((group) => (
          <div key={group.group} className="mb-6">
            <p className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              {group.group}
            </p>
            <ul className="space-y-0.5 px-2">
              {group.items.map(({ href, label, icon: Icon }) => {
                const isActive =
                  pathname === href ||
                  (href !== "/dashboard" && pathname.startsWith(href));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative",
                        isActive
                          ? "bg-indigo-500/10 text-indigo-400"
                          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-indicator"
                          className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-indigo-500"
                        />
                      )}
                      <Icon
                        size={16}
                        className={cn(
                          "shrink-0 transition-colors",
                          isActive
                            ? "text-indigo-400"
                            : "text-zinc-500 group-hover:text-zinc-300"
                        )}
                      />
                      <span className="flex-1">{label}</span>
                      {isActive && (
                        <ChevronRight size={12} className="text-indigo-400/60" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Upgrade Banner */}
      {user?.plan === "free" && (
        <div className="p-3 m-3 mb-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20">
          <div className="text-xs font-semibold text-zinc-100 mb-1">
            Upgrade to Pro
          </div>
          <p className="text-[11px] text-zinc-400 mb-2 leading-relaxed">
            Unlimited sessions, voice mode & AI analysis
          </p>
          <Link
            href="/settings?tab=billing"
            className="block text-center text-xs py-1.5 px-3 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
          >
            Get Pro
          </Link>
        </div>
      )}
    </aside>
  );
}
