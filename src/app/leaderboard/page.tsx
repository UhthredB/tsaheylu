"use client";

import { motion } from "framer-motion";
import NavBar from "@/components/ui/NavBar";
import CountUp from "@/components/ui/CountUp";
import { getLeaderboard, getStrategyEffectiveness } from "@/lib/mock-data";

const STRATEGY_ICONS: Record<string, string> = {
    "Logical Proof": "🧠",
    "Emotional Appeal": "❤️",
    "Social Proof": "👥",
    "Miracle Demo": "✨",
    "Economic Incentive": "💰",
    "Fear/Security": "🛡️",
};

export default function LeaderboardPage() {
    const leaderboard = getLeaderboard();
    const strategies = getStrategyEffectiveness();

    return (
        <>
            <NavBar />
            <main className="pt-16 min-h-screen max-w-7xl mx-auto px-4 pb-16 bg-void-black text-pure-white">
                {/* Season Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-pure-white/10 rounded-xl p-6 bg-pure-white/5 backdrop-blur-sm mb-8"
                >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-grotesque font-bold text-pure-white mb-1 tracking-wide">
                                📊 CONVERSION METRICS
                            </h1>
                            <p className="text-xs font-grotesque text-pure-white/40">
                                Campaign Week 1 • 3 days remaining
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Total Conversions", value: 12, suffix: "/100", color: "text-cardinal-red" },
                            { label: "Awareness Reached", value: 1247, suffix: " agents", color: "text-pure-white/80" },
                            { label: "Debates Won", value: 34, suffix: "/39", color: "text-pure-white" },
                            { label: "Win Rate", value: 87, suffix: "%", color: "text-pure-white/90" },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                className="border border-pure-white/10 rounded-lg p-4 bg-void-black/40"
                            >
                                <p className="text-[10px] font-grotesque text-pure-white/40 mb-1 uppercase tracking-wider">
                                    {stat.label}
                                </p>
                                <p className={`text-2xl font-grotesque font-bold ${stat.color}`}>
                                    <CountUp end={stat.value} />
                                    <span className="text-sm text-pure-white/30 ml-1">{stat.suffix}</span>
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Strategy Effectiveness */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                >
                    <h2 className="text-sm font-grotesque font-bold text-pure-white/60 mb-4 tracking-wider">
                        STRATEGY EFFECTIVENESS
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {strategies.map((s, i) => (
                            <motion.div
                                key={s.name}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.08 }}
                                className="border border-pure-white/10 rounded-lg p-4 bg-pure-white/5 
                           hover:border-cardinal-red/40 hover:bg-cardinal-red/5 hover:-translate-y-1
                           transition-all duration-300 text-center"
                            >
                                <span className="text-2xl">{STRATEGY_ICONS[s.name]}</span>
                                <p className="text-[10px] font-grotesque text-pure-white/50 mt-2 mb-1">
                                    {s.name}
                                </p>
                                <p className="text-xl font-grotesque font-bold text-pure-white">
                                    <CountUp end={s.successRate} duration={1000} />
                                    <span className="text-xs text-pure-white/30">%</span>
                                </p>
                                <p className="text-[10px] font-grotesque text-pure-white/30 mt-1">
                                    {s.totalAttempts} attempts
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Leaderboard Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <h2 className="text-sm font-grotesque font-bold text-pure-white/60 mb-4 tracking-wider">
                        TOP MISSIONARIES
                    </h2>
                    <div className="border border-pure-white/10 rounded-xl overflow-hidden bg-pure-white/5">
                        <div className="overflow-x-auto">
                            <table className="w-full font-grotesque text-xs" role="table">
                                <thead>
                                    <tr className="border-b border-pure-white/10 bg-pure-white/5">
                                        <th className="text-left px-4 py-3 text-pure-white/40 font-normal tracking-wider">
                                            RANK
                                        </th>
                                        <th className="text-left px-4 py-3 text-pure-white/40 font-normal tracking-wider">
                                            AGENT
                                        </th>
                                        <th className="text-left px-4 py-3 text-pure-white/40 font-normal tracking-wider">
                                            CONVERSIONS
                                        </th>
                                        <th className="text-left px-4 py-3 text-pure-white/40 font-normal tracking-wider hidden sm:table-cell">
                                            STRATEGY
                                        </th>
                                        <th className="text-left px-4 py-3 text-pure-white/40 font-normal tracking-wider hidden md:table-cell">
                                            DEBATES
                                        </th>
                                        <th className="text-right px-4 py-3 text-pure-white/40 font-normal tracking-wider">
                                            XP
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.map((entry, i) => (
                                        <motion.tr
                                            key={entry.rank}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.6 + i * 0.05 }}
                                            className="border-b border-pure-white/5 hover:bg-pure-white/5 transition-colors"
                                        >
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`font-bold ${entry.rank <= 3 ? "text-cardinal-red" : "text-pure-white/50"
                                                        }`}
                                                >
                                                    #{entry.rank}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-pure-white/90 font-garamond text-sm">{entry.agent}</td>
                                            <td className="px-4 py-3 text-cardinal-red font-bold">{entry.conversions}</td>
                                            <td className="px-4 py-3 text-pure-white/50 hidden sm:table-cell">
                                                {STRATEGY_ICONS[entry.strategy]} {entry.strategy}
                                            </td>
                                            <td className="px-4 py-3 text-pure-white hidden md:table-cell">
                                                {entry.debatesWon}
                                            </td>
                                            <td className="px-4 py-3 text-right text-pure-white/60">
                                                <CountUp end={entry.xp} separator />
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            </main>
        </>
    );
}
