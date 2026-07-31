"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GemachForm } from "@/components/GemachForm";
import { PageSkeleton } from "@/components/Skeleton";

export default function EditGemachPage() {
  const { id } = useParams<{ id: string }>();
  const [gemach, setGemach] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/gemachs/${id}`)
      .then((r) => r.json())
      .then((d) => { setGemach(d.gemach); setLoading(false); });
  }, [id]);

  if (loading) return <PageSkeleton />;
  if (!gemach) return <div className="text-center py-16 text-gray-500">Gemach not found.</div>;

  return <GemachForm initial={gemach} id={id} />;
}
