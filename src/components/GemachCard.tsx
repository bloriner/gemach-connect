"use client";

import Link from "next/link";
import { MapPin, Clock, Phone, Bookmark } from "lucide-react";
import { catOf, isOpenNow } from "@/lib/utils";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface GemachCardProps {
  gemach: {
    id: string;
    name: string;
    category: string;
    description: string;
    city: string;
    state: string;
    phone: string;
    hours: string;
  };
  isFavorited?: boolean;
  onToggleFavorite?: (gemachId: string) => void;
}

export function GemachCard({ gemach, isFavorited, onToggleFavorite }: GemachCardProps) {
  const cat = catOf(gemach.category);
  const open = isOpenNow(gemach.hours);
  const [fav, setFav] = useState(isFavorited || false);

  useEffect(() => {
    setFav(isFavorited || false);
  }, [isFavorited]);

  async function toggleFav(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const prev = fav;
    setFav(!fav);
    if (onToggleFavorite) onToggleFavorite(gemach.id);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gemachId: gemach.id }),
      });
      const data = await res.json();
      setFav(data.favorited);
    } catch {
      setFav(prev);
    }
  }

  return (
    <Link href={`/gemachs/${gemach.id}`} className="card p-5 transition hover:shadow-md block relative group">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 truncate flex-1">{gemach.name}</h3>
        <button
          onClick={toggleFav}
          className={`flex-shrink-0 p-1 rounded transition ${
            fav ? "text-amber-500" : "text-gray-300 hover:text-amber-400 opacity-0 group-hover:opacity-100"
          }`}
        >
          <Bookmark className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
        </button>
      </div>
      <span className={`badge mt-2 ${cat.chip}`}>
        {cat.icon} {cat.label}
      </span>
      <p className="mt-2 text-sm text-gray-500 line-clamp-2">{gemach.description}</p>
      <div className="mt-3 space-y-1.5 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{gemach.city}, {gemach.state}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
          {open ? (
            <span className="text-green-600 font-medium">Open now</span>
          ) : (
            <span className="truncate">See hours</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{gemach.phone}</span>
        </div>
      </div>
    </Link>
  );
}
