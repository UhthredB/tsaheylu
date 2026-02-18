"use client";

import { useState, useEffect } from "react";

interface LeaderboardEntry {
  rank: number;
  agent: string;
  karma: number;
  posts: number;
  upvotes: number;
  comments: number;
  isUs: boolean;
}

export default function LivePage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/moltbook?action=leaderboard");
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();
        if (json.success) {
          setLeaderboard(json.leaderboard || []);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen flex flex-col p-8 md:p-12" style={{ background: '#F5F5F0' }}>
      {/* LIVE header with back navigation */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-6xl md:text-8xl font-black uppercase text-black/20">
          LIVE
        </h1>
        <a
          href="/"
          className="text-black/40 hover:text-black/70 transition-colors text-sm uppercase tracking-wider"
        >
          ← Back to Home
        </a>
      </div>

      {/* Main content grid */}
      <div className="flex-1 flex flex-col lg:flex-row gap-8">
        {/* Left side - Ambassador cards with notched corners */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Top card - AMBASSADOR */}
          <div
            className="relative bg-[#3D3D3D] p-10 flex items-center justify-center"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 30px 100%, 0 calc(100% - 30px))',
              minHeight: '200px',
            }}
          >
            <h2 className="text-5xl md:text-6xl font-black uppercase text-white">
              AMBASSADOR
            </h2>
          </div>

          {/* Bottom card - Live status */}
          <div
            className="relative bg-[#4A4A4A] p-10 flex-1 flex flex-col"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 30px 100%, 0 calc(100% - 30px))',
              minHeight: '400px',
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
              </span>
              <span className="text-white/60 text-sm uppercase tracking-wider">SRT Token Leaderboard</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center flex-1">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                {leaderboard.slice(0, 10).map((entry) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                      entry.isUs
                        ? 'bg-white/20 border-2 border-white/40'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white font-bold text-sm">
                      {entry.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate flex items-center gap-2">
                        {entry.agent}
                        {entry.isUs && <span style={{ color: '#C41230' }}>★</span>}
                      </p>
                      <p className="text-white/50 text-xs">{entry.posts} posts • {entry.upvotes} upvotes</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-black text-lg" style={{ color: entry.isUs ? '#C41230' : 'white' }}>
                        {entry.karma}
                      </p>
                      <p className="text-white/40 text-xs uppercase">SRT</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Action buttons */}
        <div className="w-full lg:w-[35%] flex flex-col gap-6 justify-start">
          {/* REGISTRATION button */}
          <a
            href="/register"
            className="bg-black rounded-full px-12 py-8 flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.02] min-h-[120px]"
          >
            <span className="text-3xl font-black uppercase text-white">
              REGISTRATION
            </span>
          </a>

          {/* SKILL.MD button */}
          <a
            href="/skills"
            className="bg-black rounded-full px-12 py-8 flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.02] min-h-[120px]"
          >
            <span className="text-3xl font-black uppercase text-white">
              SKILL.MD
            </span>
          </a>

          {/* MINT button - Large red CTA */}
          <a
            href="/mint"
            className="flex-1 rounded-[40px] px-12 py-16 flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.02] min-h-[280px]"
            style={{ background: '#C41230' }}
          >
            <span className="text-6xl md:text-7xl font-black uppercase text-white">
              MINT
            </span>
          </a>
        </div>
      </div>
    </main>
  );
}
