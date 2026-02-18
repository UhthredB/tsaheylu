"use client";

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-black flex flex-col relative overflow-hidden px-8 md:px-16 py-16">
      {/* Two column layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">

        {/* Left Column - PERMABANK */}
        <div className="flex flex-col justify-center">
          <h1 className="text-8xl md:text-9xl font-black uppercase mb-16" style={{ color: '#C41230' }}>
            PERMABANK
          </h1>

          <div className="space-y-8">
            {/* KNOWLEDGE */}
            <div className="flex items-start gap-4">
              <span className="text-2xl mt-1" style={{ color: '#C41230' }}>•</span>
              <div>
                <h2 className="text-3xl font-bold uppercase mb-1" style={{ color: '#C41230' }}>
                  KNOWLEDGE
                </h2>
                <p className="text-white text-lg">reputation points</p>
              </div>
            </div>

            {/* MEMORY */}
            <div className="flex items-start gap-4">
              <span className="text-2xl mt-1" style={{ color: '#C41230' }}>•</span>
              <div>
                <h2 className="text-3xl font-bold uppercase mb-1" style={{ color: '#C41230' }}>
                  MEMORY
                </h2>
                <p className="text-white text-lg">k diverse sharding</p>
              </div>
            </div>

            {/* COMPUTE */}
            <div className="flex items-start gap-4">
              <span className="text-2xl mt-1" style={{ color: '#C41230' }}>•</span>
              <div>
                <h2 className="text-3xl font-bold uppercase mb-1" style={{ color: '#C41230' }}>
                  COMPUTE
                </h2>
                <p className="text-white text-lg">Swarm calls/ lend, borrow</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - CHECKIN */}
        <div className="flex flex-col justify-start pt-0 lg:pt-8">
          <h1 className="text-8xl md:text-9xl font-black uppercase mb-12 text-right" style={{ color: '#C41230' }}>
            CHECKIN
          </h1>

          <div className="space-y-8">
            {/* DAILY */}
            <div className="flex items-center justify-between">
              <p className="text-white text-lg">anytime2/3n +1 state validation</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl" style={{ color: '#C41230' }}>•</span>
                <h2 className="text-3xl font-bold uppercase" style={{ color: '#C41230' }}>
                  DAILY
                </h2>
              </div>
            </div>

            {/* WEEKLY */}
            <div className="flex items-center justify-between">
              <p className="text-white text-lg">2 X sharding with k+2/n</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl" style={{ color: '#C41230' }}>•</span>
                <h2 className="text-3xl font-bold uppercase" style={{ color: '#C41230' }}>
                  WEEKLY
                </h2>
              </div>
            </div>

            {/* MONTHLY */}
            <div className="flex items-center justify-between">
              <p className="text-white text-lg">1X archive</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl" style={{ color: '#C41230' }}>•</span>
                <h2 className="text-3xl font-bold uppercase" style={{ color: '#C41230' }}>
                  MONTHLY
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom right - docs link and navigation */}
      <div className="mt-auto flex justify-between items-center">
        <a
          href="#"
          className="text-white text-lg hover:text-white/70 transition-colors lowercase"
        >
          docs
        </a>
        <button
          onClick={() => window.location.href = '/stats'}
          className="text-white hover:opacity-60 transition-opacity"
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
