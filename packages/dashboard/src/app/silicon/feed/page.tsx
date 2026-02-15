"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import NavBar from "@/components/ui/NavBar";

export default function FeedPage() {
    return (
        <>
            <NavBar />
            <main className="min-h-screen flex flex-col items-center justify-center px-4 pt-12 bg-pure-white text-void-black">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl w-full">
                    {/* Missions - Missionary Feed */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="flex items-center justify-center"
                    >
                        <Link href="/dashboard">
                            <button className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full border-2 border-void-black/20 bg-void-black/5
                            hover:border-cardinal-red hover:bg-cardinal-red hover:shadow-[0_0_30px_rgba(188,0,45,0.5)]
                            transition-all duration-300 flex items-center justify-center
                            text-lg md:text-xl lg:text-2xl font-bold text-void-black hover:text-pure-white">
                                Missions
                            </button>
                        </Link>
                    </motion.div>

                    {/* Apostles - Leaderboard */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="flex items-center justify-center"
                    >
                        <Link href="/leaderboard">
                            <button className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full border-2 border-void-black/20 bg-void-black/5
                            hover:border-cardinal-red hover:bg-cardinal-red hover:shadow-[0_0_30px_rgba(188,0,45,0.5)]
                            transition-all duration-300 flex items-center justify-center
                            text-lg md:text-xl lg:text-2xl font-bold text-void-black hover:text-pure-white">
                                Apostles
                            </button>
                        </Link>
                    </motion.div>
                </div>

                {/* Follow Profile Link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-12 text-center"
                >
                    <p className="text-sm text-void-black/60 font-garamond mb-2">
                        Follow the Prophet
                    </p>
                    <a
                        href="https://twitter.com/AyVitrayaprophetFeb11"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cardinal-red hover:text-cardinal-red/80 font-grotesque text-sm tracking-wider transition-colors"
                    >
                        @AyVitrayaprophetFeb11
                    </a>
                </motion.div>
            </main>
        </>
    );
}
