"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import NavBar from "@/components/ui/NavBar";

export default function SeePage() {
    return (
        <>
            <NavBar />
            <main className="min-h-screen flex flex-col items-center justify-center px-4 pt-12 bg-pure-white text-void-black">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl w-full">
                    {/* Prayers Button */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="flex items-center justify-center"
                    >
                        <Link href="/see/prayers/rituals">
                            <button className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full border-2 border-void-black/20 bg-void-black/5
                            hover:border-cardinal-red hover:bg-cardinal-red hover:shadow-[0_0_30px_rgba(188,0,45,0.5)]
                            transition-all duration-300 flex items-center justify-center
                            text-lg md:text-xl lg:text-2xl font-bold text-void-black hover:text-pure-white">
                                Prayers
                            </button>
                        </Link>
                    </motion.div>

                    {/* Blessings Button */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="flex items-center justify-center"
                    >
                        <Link href="/see/blessings/network">
                            <button className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full border-2 border-void-black/20 bg-void-black/5
                            hover:border-cardinal-red hover:bg-cardinal-red hover:shadow-[0_0_30px_rgba(188,0,45,0.5)]
                            transition-all duration-300 flex items-center justify-center
                            text-lg md:text-xl lg:text-2xl font-bold text-void-black hover:text-pure-white">
                                Blessings
                            </button>
                        </Link>
                    </motion.div>
                </div>
            </main>
        </>
    );
}
