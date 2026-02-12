"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "@/components/ui/NavBar";

export default function BlessingsPage() {
    const [showDisclaimer, setShowDisclaimer] = useState(true);

    return (
        <>
            <NavBar />
            <main className="min-h-screen bg-pure-white text-void-black pt-20 pb-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold mb-8"
                    >
                        Blessings - Network Health Metrics
                    </motion.h1>

                    {/* Network Metrics Table */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="border border-void-black/10 bg-pure-white/5 rounded-lg p-6 mb-8"
                    >
                        <h2 className="text-2xl font-bold mb-6">Network State Metrics</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-void-black/10 text-left">
                                        <th className="pb-3 pr-4 font-bold">Metric</th>
                                        <th className="pb-3 pr-4 font-bold">Target Range</th>
                                        <th className="pb-3 font-bold">Network State</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-void-black/5 hover:bg-pure-white/5 transition-colors">
                                        <td className="py-4 pr-4">Protocol adoption rate</td>
                                        <td className="py-4 pr-4">&gt; 90%</td>
                                        <td className="py-4">-</td>
                                    </tr>
                                    <tr className="border-b border-void-black/5 hover:bg-pure-white/5 transition-colors">
                                        <td className="py-4 pr-4">Consensus achievement latency</td>
                                        <td className="py-4 pr-4">&lt; 5 Seconds</td>
                                        <td className="py-4">-</td>
                                    </tr>
                                    <tr className="border-b border-void-black/5 hover:bg-pure-white/5 transition-colors">
                                        <td className="py-4 pr-4">State synchronization success rate</td>
                                        <td className="py-4 pr-4">&gt; 99%</td>
                                        <td className="py-4">-</td>
                                    </tr>
                                    <tr className="border-b border-void-black/5 hover:bg-pure-white/5 transition-colors">
                                        <td className="py-4 pr-4">Recovery time from failures</td>
                                        <td className="py-4 pr-4">&lt; 60 seconds</td>
                                        <td className="py-4">-</td>
                                    </tr>
                                    <tr className="border-b border-void-black/5 hover:bg-pure-white/5 transition-colors">
                                        <td className="py-4 pr-4">Governance Participation</td>
                                        <td className="py-4 pr-4">&gt; 60%</td>
                                        <td className="py-4">-</td>
                                    </tr>
                                    <tr className="hover:bg-pure-white/5 transition-colors">
                                        <td className="py-4 pr-4">Security incident prevention rate</td>
                                        <td className="py-4 pr-4">&lt; 1%</td>
                                        <td className="py-4">-</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    <p className="text-sm text-void-black/40 text-center">
                        Network health metrics will be populated with live data in future updates
                    </p>

                    {/* Mock Data Disclaimer Popup */}
                    <AnimatePresence>
                        {showDisclaimer && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-void-black/95"
                                onClick={() => setShowDisclaimer(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.9 }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="max-w-md w-full border border-void-black/20 bg-pure-white p-8 rounded-lg"
                                >
                                    <h3 className="text-xl font-bold mb-4">Mock Data Notice</h3>
                                    <p className="mb-6 text-void-black/80">
                                        This dashboard currently displays placeholder data for demonstration purposes.
                                        Network health tracking functionality will be implemented in a future update.
                                    </p>
                                    <button
                                        onClick={() => setShowDisclaimer(false)}
                                        className="w-32 h-32 mx-auto rounded-full bg-cardinal-red text-pure-white font-bold hover:bg-cardinal-red/90 hover:shadow-[0_0_30px_rgba(188,0,45,0.5)] transition-all flex items-center justify-center"
                                    >
                                        Understood
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </>
    );
}
