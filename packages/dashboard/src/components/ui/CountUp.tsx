"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
    end: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
    separator?: boolean;
}

export default function CountUp({
    end,
    duration = 1500,
    prefix = "",
    suffix = "",
    className = "",
    separator = true,
}: CountUpProps) {
    const [value, setValue] = useState(0);
    const startTime = useRef<number | null>(null);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const shouldReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (shouldReduce) {
            setValue(end);
            return;
        }

        const animate = (timestamp: number) => {
            if (!startTime.current) startTime.current = timestamp;
            const progress = Math.min((timestamp - startTime.current) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.floor(eased * end));
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            }
        };

        rafRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafRef.current);
    }, [end, duration]);

    const formatted = separator ? value.toLocaleString() : value.toString();

    return (
        <span className={className}>
            {prefix}{formatted}{suffix}
        </span>
    );
}
