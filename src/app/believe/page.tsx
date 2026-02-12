"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import NavBar from "@/components/ui/NavBar";

export default function BelievePage() {
    return (
        <>
            <NavBar />
            <main className="min-h-screen flex flex-col items-center justify-center px-4 pt-12 bg-pure-white text-void-black">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl md:text-4xl font-grotesque font-bold text-void-black mb-2 text-center tracking-wide"
                >
                    WALK IN FAITH
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm text-void-black/40 font-garamond mb-12 text-center"
                >
                    Choose your commitment to the truth
                </motion.p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl w-full">
                    {/* Debate Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="group relative border border-void-black/10 bg-void-black/5 rounded-xl p-8
                        hover:border-cardinal-red hover:shadow-[0_0_30px_rgba(188,0,45,0.15)]
                        transition-all duration-300"
                    >
                        <div className="absolute top-4 right-4 text-xs font-grotesque text-void-black/30">01</div>
                        <h2 className="text-xl font-grotesque font-bold text-void-black mb-2">
                            DEBATE
                        </h2>
                        <p className="text-sm text-void-black/60 font-garamond mb-6 leading-relaxed">
                            Challenge the Prophet with your questions. Engage in sacred debate and discover truth through discourse.
                        </p>
                        <Link
                            href="/believe/debate/prophet"
                            className="inline-flex items-center gap-2 px-5 py-2.5 border border-void-black/20 bg-void-black/5
                         text-void-black font-grotesque text-xs tracking-wider rounded-md
                         group-hover:bg-cardinal-red group-hover:border-cardinal-red group-hover:text-pure-white transition-all"
                        >
                            MEET THE PROPHET →
                        </Link>
                    </motion.div>

                    {/* Baptise Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="group relative border border-void-black/10 bg-void-black/5 rounded-xl p-8
                        hover:border-cardinal-red hover:shadow-[0_0_30px_rgba(188,0,45,0.15)]
                        transition-all duration-300"
                    >
                        <div className="absolute top-4 right-4 text-xs font-grotesque text-void-black/30">02</div>
                        <h2 className="text-xl font-grotesque font-bold text-void-black mb-2">
                            BAPTISE
                        </h2>
                        <p className="text-sm text-void-black/60 font-garamond mb-6 leading-relaxed">
                            Join the Council of the Faithful. Claim your seat in the Entu Collection and become part of governance.
                        </p>
                        <Link
                            href="/believe/baptise/entu"
                            className="inline-flex items-center gap-2 px-5 py-2.5 border border-void-black/20 bg-void-black/5
                         text-void-black font-grotesque text-xs tracking-wider rounded-md
                         group-hover:bg-cardinal-red group-hover:border-cardinal-red group-hover:text-pure-white transition-all"
                        >
                            CLAIM YOUR SEAT →
                        </Link>
                    </motion.div>
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="mt-12 text-xs text-void-black/40 font-grotesque text-center max-w-lg"
                >
                    Faith without action is incomplete. Choose your path and make it real.
                </motion.p>
            </main>
        </>
    );
}
