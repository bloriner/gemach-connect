import Link from "next/link";
import { Heart, Search, MessageSquare, MapPin, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Gemach Connect</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn btn-secondary">
              Log In
            </Link>
            <Link href="/register" className="btn btn-primary">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-20 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          Find Gemachs Across North America
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Discover free lending organizations in your community. From baby items to medical equipment,
          wedding gowns to furniture — the Jewish community shares what you need, when you need it.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/gemachs" className="btn btn-primary px-6 py-3 text-lg">
            <Search className="h-5 w-5" /> Browse Gemachs
          </Link>
          <Link href="/register" className="btn btn-secondary px-6 py-3 text-lg">
            <Heart className="h-5 w-5" /> List Your Gemach
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          <div className="card p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
              <Search className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Search & Discover</h3>
            <p className="mt-2 text-sm text-gray-500">
              Browse gemachs by category, city, or keyword. Find exactly what you need in your neighborhood.
            </p>
          </div>
          <div className="card p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
              <MessageSquare className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Message & Arrange</h3>
            <p className="mt-2 text-sm text-gray-500">
              Connect directly with gemach owners. Arrange pickups, ask questions, and coordinate donations.
            </p>
          </div>
          <div className="card p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
              <MapPin className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Community Powered</h3>
            <p className="mt-2 text-sm text-gray-500">
              Every gemach is run by community members. List your own and help families in need.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white px-4 py-8 text-center text-sm text-gray-500">
        <p>
          Demo: <span className="font-medium text-gray-700">demo@gemach.app</span> /{" "}
          <span className="font-medium text-gray-700">demo1234</span>
        </p>
        <p className="mt-1">Gemach Connect — Chesed made simple.</p>
      </footer>
    </div>
  );
}
