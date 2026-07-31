"use client";

import { useSession } from "next-auth/react";
import { User, Mail, Phone, MapPin } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      <div className="card p-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
          <User className="h-10 w-10 text-primary-600" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">{session.user.name}</h2>
        <p className="text-gray-500">{session.user.email}</p>
      </div>
    </div>
  );
}
