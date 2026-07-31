"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Heart,
  Home,
  Search,
  Plus,
  MessageSquare,
  User,
  LogOut,
  Bookmark,
  Package,
  Shield,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/gemachs", label: "Browse Gemachs", icon: Search },
  { href: "/dashboard/my-gemachs", label: "My Gemachs", icon: Heart },
  { href: "/dashboard/new", label: "Add Gemach", icon: Plus },
  { href: "/dashboard/requests", label: "Requests", icon: Package },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/saved", label: "Saved", icon: Bookmark },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/admin", label: "Admin", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r border-gray-800 bg-gray-900">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
          <Heart className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-white">Gemach Connect</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      {session?.user && (
        <div className="border-t border-gray-800 px-4 py-4 space-y-3">
          <div className="text-sm">
            <p className="font-medium text-gray-200 truncate">{session.user.name}</p>
            <p className="text-gray-500 truncate text-xs">{session.user.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-gray-200"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}
