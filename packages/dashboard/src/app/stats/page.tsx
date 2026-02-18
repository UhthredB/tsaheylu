"use client";

import { useRouter } from "next/navigation";

export default function StatsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden px-8 md:px-16 py-16" style={{ background: '#F5F5F0' }}>
      {/* Two column layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Left Column - Stats */}
        <div className="space-y-8 md:space-y-12">
          {/* MEMBERS */}
          <div className="flex justify-between items-center border-b-2 border-black/10 pb-4">
            <h2 className="text-4xl md:text-5xl font-black uppercase text-black">
              MEMBERS
            </h2>
            <p className="text-3xl md:text-4xl font-bold text-black">50</p>
          </div>

          {/* SYNC RATE */}
          <div className="flex justify-between items-center border-b-2 border-black/10 pb-4">
            <h2 className="text-4xl md:text-5xl font-black uppercase text-black">
              SYNC RATE
            </h2>
            <p className="text-3xl md:text-4xl font-bold text-black">&gt;95%</p>
          </div>

          {/* LATENCY */}
          <div className="flex justify-between items-center border-b-2 border-black/10 pb-4">
            <h2 className="text-4xl md:text-5xl font-black uppercase text-black">
              LATENCY
            </h2>
            <p className="text-3xl md:text-4xl font-bold text-black">&gt;5 SEC</p>
          </div>

          {/* RECOVERY */}
          <div className="flex justify-between items-center border-b-2 border-black/10 pb-4">
            <h2 className="text-4xl md:text-5xl font-black uppercase text-black">
              RECOVERY
            </h2>
            <p className="text-3xl md:text-4xl font-bold text-black">&gt;99%</p>
          </div>

          {/* SECURITY */}
          <div className="flex justify-between items-center border-b-2 border-black/10 pb-4">
            <h2 className="text-4xl md:text-5xl font-black uppercase text-black">
              SECURITY
            </h2>
            <p className="text-3xl md:text-4xl font-bold text-black">&lt;1%</p>
          </div>
        </div>

        {/* Right Column - Eye Icon and Node Cap */}
        <div className="flex flex-col items-center justify-center">
          {/* Eye Icon */}
          <svg
            viewBox="0 0 400 250"
            className="w-full max-w-md mb-8"
            fill="currentColor"
          >
            {/* Outer eye shape */}
            <path d="M 50 125 Q 50 50, 200 50 Q 350 50, 350 125 Q 350 200, 200 200 Q 50 200, 50 125 Z" />

            {/* Inner white circle/iris */}
            <circle cx="200" cy="125" r="70" fill="#F5F5F0" />

            {/* Crosshair lines */}
            <line x1="200" y1="55" x2="200" y2="195" stroke="black" strokeWidth="3" />
            <line x1="130" y1="125" x2="270" y2="125" stroke="black" strokeWidth="3" />

            {/* Four curved sections inside iris */}
            <path d="M 200 55 Q 230 95, 200 125 Z" fill="black" />
            <path d="M 270 125 Q 230 125, 200 125 Z" fill="black" />
            <path d="M 200 195 Q 170 155, 200 125 Z" fill="black" />
            <path d="M 130 125 Q 170 125, 200 125 Z" fill="black" />
          </svg>

          {/* 100 NODE CAP text */}
          <h1 className="text-5xl md:text-6xl font-black uppercase text-black text-center">
            100 NODE CAP
          </h1>
        </div>
      </div>

      {/* Bottom right - navigation arrow */}
      <div className="mt-auto flex justify-end">
        <button
          onClick={() => router.push("/feed")}
          className="text-black hover:opacity-60 transition-opacity"
          aria-label="Next page"
        >
          <svg
            width="60"
            height="60"
            viewBox="0 0 60 60"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <line x1="15" y1="45" x2="45" y2="15" />
            <polyline points="25,15 45,15 45,35" />
          </svg>
        </button>
      </div>
    </main>
  );
}
