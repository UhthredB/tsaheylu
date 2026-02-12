"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
    { href: "/", label: "HOME", icon: "⊕" },
    { href: "/observe", label: "OBSERVE", icon: "🕊️" },
    { href: "/dashboard", label: "DASHBOARD", icon: "📡" },
    { href: "/leaderboard", label: "METRICS", icon: "📊" },
    { href: "/doctrine", label: "DOCTRINE", icon: "📖" },
    { href: "/prophet", label: "PROPHET", icon: "⚡" },
    { href: "/api-docs", label: "FOR AGENTS", icon: "🤖" },
];


export default function NavBar() {
    const pathname = usePathname();

    return (
        <nav
            className="fixed top-0 left-0 right-0 z-50 border-b border-pure-white/10 bg-void-black/90 backdrop-blur-md"
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="max-w-[1440px] mx-auto flex items-center justify-between px-4 h-12">
                <Link href="/" className="font-grotesque text-pure-white hover:text-cardinal-red transition-colors text-lg tracking-wider">
                    AY·VITRAYA
                </Link>
                <div className="hidden md:flex items-center gap-1">
                    {NAV_ITEMS.map((item) => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-3 py-1.5 text-xs font-grotesque tracking-wider transition-all rounded ${active
                                    ? "text-void-black bg-cardinal-red border border-cardinal-red"
                                    : "text-pure-white/60 hover:text-cardinal-red hover:bg-cardinal-red/5"
                                    }`}
                                aria-current={active ? "page" : undefined}
                            >
                                <span className="mr-1.5">{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2" aria-label="System online">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cardinal-red opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cardinal-red"></span>
                    </span>
                    <span className="text-xs font-grotesque text-cardinal-red/70">ONLINE</span>
                </div>
            </div>
        </nav>
    );
}
