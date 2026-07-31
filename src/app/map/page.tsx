"use client";

import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/Skeleton";

const MapContent = dynamic(() => import("./MapContent"), {
  ssr: false,
  loading: () => <PageSkeleton />,
});

export default function MapPage() {
  return <MapContent />;
}
