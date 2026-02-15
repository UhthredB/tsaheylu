"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "@/components/ui/NavBar";
import CountUp from "@/components/ui/CountUp";

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
}

interface DashboardData {
    agent: {
        name: string;
        karma: number;
        status: string;
        claimedAt: string | null;
    };
    stats: {
        totalPosts: number;
        totalUpvotes: number;
        totalComments: number;
        feedSize: number;
    };
    events: FeedEvent[];
}

const SIDEBAR_VIEWS = [
    { id: "all", label: "All of Moltbook" },
    { id: "ours", label: "Our Posts" },
    { id: "popular", label: "Most Upvoted" },
];

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
    });
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

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeView, setActiveView] = useState("all");
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const feedRef = useRef<HTMLDivElement>(null);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/api/moltbook?action=dashboard");
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const json = await res.json();
            if (json.success) {
                setData(json);
                setError(null);
                setLastRefresh(new Date());
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch data");
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh every 60s
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchData]);

    const filteredEvents = data?.events?.filter(e => {
        if (activeView === "ours") return e.agentName === data.agent.name;
        if (activeView === "popular") return e.upvotes > 0;
        return true;
    }) ?? [];

    const exportCSV = () => {
        if (!data?.events) return;
        const headers = ["ID", "Timestamp", "Agent", "Title", "Upvotes", "Comments", "Submolt"];
        const rows = data.events.map(e => [
            e.id,
            e.timestamp,
            e.agentName,
            `"${e.title.replace(/"/g, '""')}"`,
            e.upvotes,
            e.commentCount,
            e.submolt,
        ]);
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `moltbook-feed-${new Date().toISOString()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <>
                <NavBar />
                <main className="pt-12 min-h-screen flex items-center justify-center bg-pure-white">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-cardinal-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-sm font-grotesque text-void-black/50">Loading live data from Moltbook...</p>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <NavBar />
            <main className="pt-12 min-h-screen flex flex-col lg:flex-row relative bg-pure-white text-void-black">
                {/* Mobile sidebar toggle */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden fixed top-14 left-2 z-40 px-2 py-1 bg-pure-white border border-void-black/30 rounded text-void-black text-xs font-grotesque"
                    aria-label="Toggle sidebar"
                >
                    Menu
                </button>

                {/* LEFT SIDEBAR */}
                <aside
                    className={`fixed lg:sticky top-12 left-0 h-[calc(100vh-48px)] w-64 lg:w-[20%] border-r border-void-black/10 bg-pure-white/95 backdrop-blur-sm p-4 overflow-y-auto z-30 transform transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                        }`}
                >
                    <h3 className="text-xs font-grotesque text-void-black/40 mb-3 tracking-wider">
                        Feed view
                    </h3>
                    <div className="space-y-1 mb-6">
                        {SIDEBAR_VIEWS.map((view) => (
                            <button
                                key={view.id}
                                onClick={() => { setActiveView(view.id); setSidebarOpen(false); }}
                                className={`w-full text-left px-3 py-2 rounded text-xs font-grotesque transition-all ${activeView === view.id
                                    ? "text-void-black bg-cardinal-red border border-cardinal-red"
                                    : "text-void-black/50 hover:text-cardinal-red hover:bg-cardinal-red/5"
                                    }`}
                                aria-pressed={activeView === view.id}
                            >
                                {view.label}
                            </button>
                        ))}
                    </div>

                    {/* Live status */}
                    <div className="border border-void-black/10 rounded-lg p-3 bg-void-black/5 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cardinal-red opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cardinal-red" />
                            </span>
                            <span className="text-xs font-grotesque text-void-black/60">Live</span>
                        </div>
                        <p className="text-[10px] font-grotesque text-void-black/30">
                            Last refresh: {lastRefresh.toLocaleTimeString()}
                        </p>
                    </div>

                    {error && (
                        <div className="border border-cardinal-red/30 rounded-lg p-3 bg-cardinal-red/5">
                            <p className="text-[10px] font-grotesque text-cardinal-red">{error}</p>
                        </div>
                    )}
                </aside>

                {/* CENTER PANEL — Feed */}
                <section className="flex-1 lg:w-[55%] border-r border-void-black/10 flex flex-col h-[calc(100vh-48px)]">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-void-black/10 bg-pure-white/90 backdrop-blur-sm sticky top-0 z-20">
                        <h2 className="text-sm font-grotesque font-bold text-void-black">
                            Moltbook Live Feed
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className={`px-2 py-1 text-xs font-grotesque rounded border transition-all ${autoRefresh
                                    ? "border-cardinal-red text-void-black bg-cardinal-red"
                                    : "border-void-black/20 text-void-black/40"
                                    }`}
                            >
                                {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
                            </button>
                            <button
                                onClick={fetchData}
                                className="px-2 py-1 text-xs font-grotesque rounded border border-void-black/20 text-void-black/40 hover:text-cardinal-red hover:border-cardinal-red transition-all"
                            >
                                Refresh
                            </button>
                            <button
                                onClick={exportCSV}
                                className="px-2 py-1 text-xs font-grotesque rounded border border-void-black/20 text-void-black/40 hover:text-cardinal-red hover:border-cardinal-red transition-all"
                            >
                                Export CSV
                            </button>
                        </div>
                    </div>

                    <div ref={feedRef} className="flex-1 overflow-y-auto p-4 space-y-2">
                        <AnimatePresence initial={false}>
                            {filteredEvents.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-sm font-grotesque text-void-black/30">No posts in this view</p>
                                </div>
                            )}
                            {filteredEvents.map((event) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`p-3 rounded-lg border bg-pure-white/60 backdrop-blur-sm transition-all hover:bg-void-black/5 ${event.agentName === data?.agent.name
                                        ? "border-cardinal-red/40 shadow-[0_0_10px_rgba(188,0,45,0.1)]"
                                        : "border-void-black/10"
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-grotesque text-void-black/30">
                                            {timeAgo(event.timestamp)}
                                        </span>
                                        <span className="text-[10px] font-grotesque font-bold text-void-black/60">
                                            {event.agentName}
                                            {event.agentName === data?.agent.name && (
                                                <span className="text-cardinal-red ml-1">★</span>
                                            )}
                                        </span>
                                        <span className="text-[10px] font-grotesque text-void-black/20 ml-auto">
                                            m/{event.submolt}
                                        </span>
                                    </div>
                                    <p className="text-sm font-garamond text-void-black/90 mb-1 line-clamp-2">
                                        {event.title}
                                    </p>
                                    <p className="text-xs font-garamond text-void-black/40 line-clamp-2">
                                        {event.detail}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-[10px] font-grotesque text-void-black/40">
                                            ▲ {event.upvotes}
                                        </span>
                                        <span className="text-[10px] font-grotesque text-void-black/40">
                                            💬 {event.commentCount}
                                        </span>
                                        <span className="text-[10px] font-grotesque text-void-black/20 ml-auto">
                                            karma: {event.karma}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </section>

                {/* RIGHT SIDEBAR — Stats */}
                <aside className="hidden lg:block w-[25%] h-[calc(100vh-48px)] overflow-y-auto p-4 space-y-6">
                    {/* Agent Status */}
                    <div className="border border-void-black/10 rounded-lg p-4 bg-pure-white/60">
                        <h3 className="text-xs font-grotesque text-void-black/40 mb-3 tracking-wider">
                            Agent status
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-garamond">
                                <span className="text-void-black/50">Agent</span>
                                <span className="text-cardinal-red flex items-center gap-1">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cardinal-red opacity-75" />
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cardinal-red" />
                                    </span>
                                    {data?.agent.name ?? "—"}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs font-garamond">
                                <span className="text-void-black/50">Status</span>
                                <span className="text-void-black capitalize">{data?.agent.status ?? "—"}</span>
                            </div>
                            <div className="flex justify-between text-xs font-garamond">
                                <span className="text-void-black/50">Karma</span>
                                <span className="text-void-black/80">
                                    <CountUp end={data?.agent.karma ?? 0} />
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="border border-void-black/10 rounded-lg p-4 bg-pure-white/60">
                        <h3 className="text-xs font-grotesque text-void-black/40 mb-3 tracking-wider">
                            Performance
                        </h3>
                        <div className="space-y-2">
                            {[
                                { label: "Posts", value: data?.stats.totalPosts ?? 0, color: "text-void-black/80" },
                                { label: "Upvotes", value: data?.stats.totalUpvotes ?? 0, color: "text-cardinal-red" },
                                { label: "Comments generated", value: data?.stats.totalComments ?? 0, color: "text-void-black/60" },
                                { label: "Feed agents", value: data?.stats.feedSize ?? 0, color: "text-void-black/60" },
                            ].map((stat) => (
                                <div key={stat.label} className="flex justify-between text-xs font-garamond">
                                    <span className="text-void-black/50">{stat.label}</span>
                                    <span className={stat.color}>
                                        <CountUp end={stat.value} />
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* NFT Governance */}
                    <div className="border border-void-black/10 rounded-lg p-4 bg-pure-white/60">
                        <h3 className="text-xs font-grotesque text-void-black/40 mb-3 tracking-wider">
                            NFT governance
                        </h3>
                        <div className="mb-2">
                            <div className="flex justify-between text-xs font-garamond mb-1">
                                <span className="text-void-black/50">Council Seats</span>
                                <span className="text-cardinal-red">
                                    0/100
                                </span>
                            </div>
                            <div className="w-full bg-void-black/10 rounded-full h-2">
                                <motion.div
                                    className="bg-cardinal-red rounded-full h-2"
                                    initial={{ width: 0 }}
                                    animate={{ width: "0%" }}
                                    transition={{ type: "spring", duration: 0.6 }}
                                />
                            </div>
                        </div>
                        <button className="w-full py-2 bg-void-black/5 border border-void-black/10 rounded text-xs font-grotesque text-void-black/60 hover:text-cardinal-red hover:border-cardinal-red transition-all">
                            View contract
                        </button>
                    </div>
                </aside>
            </main>
        </>
    );
}
