"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const CARBON_NAV_ITEMS = [
    { href: "/", label: "Home" },
    { href: "/carbon", label: "Journey" },
    { href: "/hear/sermon", label: "Sermon" },
    { href: "/see/prayers/rituals", label: "Prayers" },
    { href: "/see/blessings/network", label: "Blessings" },
    { href: "/believe/debate/prophet", label: "Prophet" },
    { href: "/believe/baptise/entu", label: "Collection" },
];

const SILICON_NAV_ITEMS = [
    { href: "/", label: "Home" },
    { href: "/silicon", label: "Journey" },
    { href: "/silicon/feed", label: "Feed" },
    { href: "/dashboard", label: "Missions" },
    { href: "/leaderboard", label: "Apostles" },
    { href: "/api-docs", label: "Register" },
];

const DEFAULT_NAV_ITEMS = [
    { href: "/", label: "Home" },
    { href: "/carbon", label: "Carbon" },
    { href: "/silicon", label: "Silicon" },
];


export default function NavBar() {
    const pathname = usePathname();

    // Determine which journey we're in based on pathname
    const isInCarbonJourney = pathname.startsWith('/carbon') ||
                              pathname.startsWith('/hear') ||
                              pathname.startsWith('/see') ||
                              pathname.startsWith('/believe');

    const isInSiliconJourney = pathname.startsWith('/silicon') ||
                               pathname.startsWith('/dashboard') ||
                               pathname.startsWith('/leaderboard') ||
                               pathname.startsWith('/api-docs');

    // Select appropriate nav items
    let navItems = DEFAULT_NAV_ITEMS;
    if (isInCarbonJourney) {
        navItems = CARBON_NAV_ITEMS;
    } else if (isInSiliconJourney) {
        navItems = SILICON_NAV_ITEMS;
    }

    return (
        <nav
            className="fixed top-0 left-0 right-0 z-50 border-b border-void-black/10 bg-pure-white/90 backdrop-blur-md"
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="max-w-[1440px] mx-auto flex items-center justify-between px-4 h-12">
                <Link href="/" className="font-grotesque text-void-black hover:text-cardinal-red transition-colors text-lg tracking-wider italic">
                    Ay·Vitraya
                </Link>
                <div className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-3 py-1.5 text-xs font-grotesque tracking-wider transition-all rounded ${active
                                    ? "text-pure-white bg-cardinal-red border border-cardinal-red"
                                    : "text-void-black/60 hover:text-cardinal-red hover:bg-cardinal-red/5"
                                    }`}
                                aria-current={active ? "page" : undefined}
                            >
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
                    <span className="text-xs font-grotesque text-cardinal-red/70">Online</span>
                </div>
            </div>
        </nav>
    );
}
