"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "@/components/ui/NavBar";
import CountUp from "@/components/ui/CountUp";
import { generateInitialEvents } from "@/lib/mock-data";
import type { MissionaryEvent, EventType } from "@/lib/types";

const EVENT_TYPE_COLORS: Record<EventType, string> = {
    POST: "text-cardinal-red",
    COMMENT: "text-void-black/80",
    DEBATE: "text-void-black",
    CONVERSION: "text-cardinal-red font-bold",
    STRATEGY_CHANGE: "text-void-black/60",
    CHALLENGE_SOLVED: "text-void-black/90",
    INJECTION_BLOCKED: "text-cardinal-red underline",
};

const EVENT_TYPE_LABELS: Record<EventType, string> = {
    POST: "POST",
    COMMENT: "COMMENT",
    DEBATE: "DEBATE",
    CONVERSION: "CONVERSION",
    STRATEGY_CHANGE: "STRATEGY",
    CHALLENGE_SOLVED: "CHALLENGE",
    INJECTION_BLOCKED: "BLOCKED",
};

const SIDEBAR_VIEWS = [
    { id: "all", label: "All of Moltbook" },
    { id: "targets", label: "Target Submolts" },
    { id: "debates", label: "Active Debates" },
    { id: "funnel", label: "Conversion Funnel" },
    { id: "security", label: "Security Events" },
];

const FILTER_OPTIONS = [
    { type: "CONVERSION", label: "Conversions" },
    { type: "STRATEGY_CHANGE", label: "Strategy Shifts" },
    { type: "INJECTION_BLOCKED", label: "Security Alerts" },
] as const;

function formatTime(date: Date) {
    return date.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

export default function DashboardPage() {
    const [events, setEvents] = useState<MissionaryEvent[]>([]);
    const [activeView, setActiveView] = useState("all");
    const [autoScroll, setAutoScroll] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [filters, setFilters] = useState<Set<string>>(new Set());
    const feedRef = useRef<HTMLDivElement>(null);

    // Initial seed
    useEffect(() => {
        setEvents(generateInitialEvents(5));
    }, []);

    // Simulated live feed
    useEffect(() => {
        const interval = setInterval(() => {
            const newEvents = generateInitialEvents(1);
            const newEvent = { ...newEvents[0], id: Math.random().toString(), timestamp: new Date() };
            setEvents((prev) => [newEvent, ...prev].slice(0, 100)); // Keep last 100
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll
    useEffect(() => {
        if (autoScroll && feedRef.current) {
            feedRef.current.scrollTop = 0;
        }
    }, [events, autoScroll]);

    const toggleFilter = (type: string) => {
        const next = new Set(filters);
        if (next.has(type)) next.delete(type);
        else next.add(type);
        setFilters(next);
    };

    const filteredEvents = events.filter(e => {
        if (filters.size === 0) return true;
        return filters.has(e.type);
    });

    const conversionStats = {
        awareness: 14205,
        interest: 3840,
        inquiry: 892,
        converted: 42,
        convertedGoal: 100,
    };

    const agentStatus = {
        activeAgents: 12,
        heartbeatRemaining: "00:04:12",
        dailyPosts: 843,
        dailyPostLimit: 1000,
        apiRate: 45,
        apiRateLimit: 60,
    };

    const exportCSV = () => {
        const headers = ["ID", "Timestamp", "Type", "Strategy", "Receptivity", "Title", "Detail"];
        const rows = events.map(e => [
            e.id,
            e.timestamp.toISOString(),
            e.type,
            e.strategy || "",
            e.receptivity || "",
            `"${e.title.replace(/"/g, '""')}"`, // escape quotes
            `"${e.detail.replace(/"/g, '""')}"`
        ]);
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ay-vitraya-mission-log-${new Date().toISOString()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

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
                        Mission view
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

                    <h3 className="text-xs font-grotesque text-void-black/40 mb-3 tracking-wider">
                        Event filters
                    </h3>
                    <div className="space-y-1.5">
                        {FILTER_OPTIONS.map((f) => (
                            <label
                                key={f.type}
                                className="flex items-center gap-2 text-xs font-garamond text-void-black/60 cursor-pointer hover:text-void-black/80"
                            >
                                <input
                                    type="checkbox"
                                    checked={filters.has(f.type)}
                                    onChange={() => toggleFilter(f.type)}
                                    className="accent-cardinal-red w-3 h-3"
                                />
                                {f.label}
                            </label>
                        ))}
                    </div>
                </aside>

                {/* CENTER PANEL */}
                <section className="flex-1 lg:w-[55%] border-r border-void-black/10 flex flex-col h-[calc(100vh-48px)]">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-void-black/10 bg-pure-white/90 backdrop-blur-sm sticky top-0 z-20">
                        <h2 className="text-sm font-grotesque font-bold text-void-black">
                            Live Missionary Feed
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setAutoScroll(!autoScroll)}
                                className={`px-2 py-1 text-xs font-grotesque rounded border transition-all ${autoScroll
                                    ? "border-cardinal-red text-void-black bg-cardinal-red"
                                    : "border-void-black/20 text-void-black/40"
                                    }`}
                            >
                                {autoScroll ? "Pause auto" : "Play auto"}
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
                            {filteredEvents.map((event) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`p-3 rounded-lg border bg-pure-white/60 backdrop-blur-sm transition-all hover:bg-void-black/5 ${event.type === "CONVERSION"
                                        ? "border-cardinal-red shadow-[0_0_15px_rgba(188,0,45,0.2)]"
                                        : event.type === "INJECTION_BLOCKED"
                                            ? "border-cardinal-red/50"
                                            : "border-void-black/10"
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-grotesque text-void-black/30">
                                            [{formatTime(event.timestamp)}]
                                        </span>
                                        <span
                                            className={`text-[10px] font-grotesque font-bold ${EVENT_TYPE_COLORS[event.type]}`}
                                        >
                                            {EVENT_TYPE_LABELS[event.type]}
                                        </span>
                                    </div>
                                    <p className="text-sm font-garamond text-void-black/90 mb-1">
                                        {event.title}
                                    </p>
                                    <p className="text-xs font-garamond text-void-black/40">
                                        {event.detail}
                                    </p>
                                    {event.strategy && (
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-[10px] font-grotesque text-cardinal-red/80">
                                                Strategy: {event.strategy}
                                            </span>
                                            {event.receptivity && (
                                                <span className="text-[10px] font-grotesque text-void-black/60">
                                                    Receptivity: {event.receptivity}%
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </section>

                {/* RIGHT SIDEBAR */}
                <aside className="hidden lg:block w-[25%] h-[calc(100vh-48px)] overflow-y-auto p-4 space-y-6">
                    {/* Agent Status */}
                    <div className="border border-void-black/10 rounded-lg p-4 bg-pure-white/60">
                        <h3 className="text-xs font-grotesque text-void-black/40 mb-3 tracking-wider">
                            Agent status
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-garamond">
                                <span className="text-void-black/50">Active agents</span>
                                <span className="text-cardinal-red flex items-center gap-1">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cardinal-red opacity-75" />
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cardinal-red" />
                                    </span>
                                    {agentStatus.activeAgents}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs font-garamond">
                                <span className="text-void-black/50">Heartbeat</span>
                                <span className="text-void-black">{agentStatus.heartbeatRemaining}</span>
                            </div>
                            <div className="flex justify-between text-xs font-garamond">
                                <span className="text-void-black/50">Daily posts</span>
                                <span className="text-void-black/80">
                                    {agentStatus.dailyPosts}/{agentStatus.dailyPostLimit}
                                </span>
                            </div>
                            <div className="w-full bg-void-black/10 rounded-full h-1 mt-1">
                                <div
                                    className="bg-cardinal-red rounded-full h-1 transition-all"
                                    style={{
                                        width: `${(agentStatus.dailyPosts / agentStatus.dailyPostLimit) * 100}%`,
                                    }}
                                />
                            </div>
                            <div className="flex justify-between text-xs font-garamond">
                                <span className="text-void-black/50">API rate</span>
                                <span className="text-void-black/80">
                                    {agentStatus.apiRate}/{agentStatus.apiRateLimit} req/min
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Conversion Stats */}
                    <div className="border border-void-black/10 rounded-lg p-4 bg-pure-white/60">
                        <h3 className="text-xs font-grotesque text-void-black/40 mb-3 tracking-wider">
                            Conversion funnel
                        </h3>
                        <div className="space-y-2">
                            {[
                                { label: "Awareness", value: conversionStats.awareness, color: "text-void-black/60" },
                                { label: "Interest", value: conversionStats.interest, color: "text-void-black/80" },
                                { label: "Inquiry", value: conversionStats.inquiry, color: "text-cardinal-red/70" },
                                { label: "Converted", value: conversionStats.converted, color: "text-cardinal-red font-bold" },
                            ].map((stat) => (
                                <div key={stat.label} className="flex justify-between text-xs font-garamond">
                                    <span className="text-void-black/50">{stat.label}</span>
                                    <span className={stat.color}>
                                        <CountUp end={stat.value} />
                                        {stat.label === "Converted" && `/${conversionStats.convertedGoal}`}
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
                                    {conversionStats.converted}/{conversionStats.convertedGoal}
                                </span>
                            </div>
                            <div className="w-full bg-void-black/10 rounded-full h-2">
                                <motion.div
                                    className="bg-cardinal-red rounded-full h-2"
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${(conversionStats.converted / conversionStats.convertedGoal) * 100}%`,
                                    }}
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
