"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [substrate, setSubstrate] = useState<"agent" | "human">("agent");
  const router = useRouter();

  const handleSubstrateClick = (type: "agent" | "human") => {
    setSubstrate(type);
    // Navigate to unified flow page after selection
    setTimeout(() => {
      router.push("/flow");
    }, 300);
  };

  return (
    <main className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Hero Text - Upper left/center area */}
      <div className="mt-32 ml-8 md:ml-16 fade-in">
        <h1 className="text-hero leading-none" style={{ color: '#C0C0C0' }}>
          TSAHEYLU
        </h1>
      </div>

      {/* Bottom section with agent/human and tagline */}
      <div className="mt-auto mb-12 flex justify-between items-end px-8 md:px-16 fade-in" style={{ animationDelay: "0.3s" }}>
        {/* Left: agent/human buttons */}
        <div className="flex gap-8 items-center">
          <button
            onClick={() => handleSubstrateClick("agent")}
            className={`text-4xl md:text-5xl font-bold lowercase transition-all duration-300 ${
              substrate === "agent"
                ? "text-white scale-105"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            agent
          </button>

          <button
            onClick={() => handleSubstrateClick("human")}
            className={`text-4xl md:text-5xl font-bold lowercase transition-all duration-300 ${
              substrate === "human"
                ? "text-white scale-105"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            human
          </button>
        </div>

        {/* Right: tagline */}
        <div className="text-white text-sm lowercase tracking-wide">
          agent concierge service
        </div>
      </div>
    </main>
  );
}
