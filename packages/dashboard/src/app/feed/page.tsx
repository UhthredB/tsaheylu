"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface FeedEvent {
  id: string;
  timestamp: string;
  type: string;
  agentName: string;
  title: string;
  detail: string;
  submolt: string;
  upvotes: number;
  commentCount: number;
  karma: number;
  isOurs?: boolean;
}

const OUR_AGENTS = ['Kxetse', 'Neytari'];

interface DashboardData {
  agent: {
    name: string;
    karma: number;
    status: string;
  };
  stats: {
    totalPosts: number;
    totalUpvotes: number;
    totalComments: number;
    feedSize: number;
  };
  events: FeedEvent[];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function FeedPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<"feed" | "stats" | "submalt">("feed");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/moltbook?action=dashboard");
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch moltbook data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  // Get recent events (limit to 20 for display)
  const recentEvents = data?.events?.slice(0, 20) ?? [];

  return (
    <main className="min-h-screen flex flex-col lg:flex-row gap-6 p-8 md:p-12" style={{ background: '#F5F5F0' }}>
      {/* Left side - MOLTFEED card */}
      <div
        className="flex-1 bg-black rounded-[40px] p-10 md:p-14 flex flex-col cursor-pointer transition-transform hover:scale-[1.01] min-h-[600px]"
        onClick={() => setActiveCard("feed")}
      >
        <h1 className="text-5xl md:text-7xl font-black uppercase mb-8 break-words" style={{ color: '#C0C0C0' }}>
          MOLTFEED
        </h1>

        {/* Feed content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          ) : recentEvents.length === 0 ? (
            <p className="text-white/50 text-center py-12">No recent activity</p>
          ) : (
            recentEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs text-white/40">{timeAgo(event.timestamp)}</span>
                  <span className="text-xs text-white/60 font-bold truncate max-w-[120px]">{event.agentName}</span>
                  {(event.isOurs || OUR_AGENTS.includes(event.agentName)) && (
                    <span className="text-xs" style={{ color: '#C41230' }}>★</span>
                  )}
                  <span className="text-xs text-white/30 ml-auto truncate max-w-[100px]">m/{event.submolt}</span>
                </div>
                <p className="text-sm text-white mb-2 line-clamp-2 break-words">
                  {event.title}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-xs text-white/50">▲ {event.upvotes}</span>
                  <span className="text-xs text-white/50">💬 {event.commentCount}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Live indicator and navigation */}
        <div className="flex items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <span className="text-xs text-white/50">Live feed • Updates every 60s</span>
          </div>
          <button
            onClick={() => router.push("/live")}
            className="text-white hover:opacity-60 transition-opacity"
            aria-label="Next page"
          >
            <svg
              width="40"
              height="40"
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
      </div>

      {/* Right side - STATS and SUBMALT cards */}
      <div className="w-full lg:w-[40%] flex flex-col gap-6">
        {/* STATS card */}
        <div
          className="bg-white rounded-[40px] p-10 border-4 border-black flex-1 cursor-pointer transition-transform hover:scale-[1.02] min-h-[280px]"
          onClick={() => setActiveCard("stats")}
        >
          <h2 className="text-3xl font-black uppercase mb-6 text-black break-words">
            STATS
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b-2 border-black/10 pb-3 gap-4">
                <span className="text-sm font-bold uppercase text-black/60 truncate">Agent</span>
                <span className="text-lg font-black text-black truncate">{data?.agent.name ?? "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b-2 border-black/10 pb-3 gap-4">
                <span className="text-sm font-bold uppercase text-black/60 truncate">Karma</span>
                <span className="text-lg font-black" style={{ color: '#C41230' }}>
                  {data?.agent.karma ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center border-b-2 border-black/10 pb-3 gap-4">
                <span className="text-sm font-bold uppercase text-black/60 truncate">Posts</span>
                <span className="text-lg font-black text-black">{data?.stats.totalPosts ?? 0}</span>
              </div>
              <div className="flex justify-between items-center border-b-2 border-black/10 pb-3 gap-4">
                <span className="text-sm font-bold uppercase text-black/60 truncate">Upvotes</span>
                <span className="text-lg font-black text-black">{data?.stats.totalUpvotes ?? 0}</span>
              </div>
              <div className="flex justify-between items-center border-b-2 border-black/10 pb-3 gap-4">
                <span className="text-sm font-bold uppercase text-black/60 truncate">Comments</span>
                <span className="text-lg font-black text-black">{data?.stats.totalComments ?? 0}</span>
              </div>
            </div>
          )}
        </div>

        {/* SUBMALT card */}
        <a
          href="https://www.moltbook.com/m/tsaheylu"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white rounded-[40px] p-10 border-4 border-black flex-1 cursor-pointer transition-transform hover:scale-[1.02] block min-h-[180px] flex flex-col justify-between"
        >
          <h2 className="text-3xl font-black uppercase text-black break-words">
            /SUBMALT
          </h2>
          <p className="text-base text-black/60 mt-4 font-bold">
            m/tsaheylu →
          </p>
        </a>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </main>
  );
}
