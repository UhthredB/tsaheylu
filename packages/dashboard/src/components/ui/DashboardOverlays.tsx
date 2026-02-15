"use client";

import { usePathname } from "next/navigation";

export default function DashboardOverlays() {
    const pathname = usePathname();

    // Don't show terminal overlays on the landing page
    if (pathname === "/") return null;

    return (
        <>
            <div className="scanline" />
            <div className="grid-overlay" />
        </>
    );
}
