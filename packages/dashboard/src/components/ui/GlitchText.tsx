"use client";

import { useEffect, useState, useRef } from "react";

interface GlitchTextProps {
    text: string;
    className?: string;
    glitchInterval?: number;
    as?: "h1" | "h2" | "h3" | "span" | "p";
}

const GLITCH_CHARS = "!@#$%^&*()_+-=[]{}|;':\",./<>?0123456789ABCDEF";

export default function GlitchText({
    text,
    className = "",
    glitchInterval = 50,
    as: Tag = "h1",
}: GlitchTextProps) {
    const [display, setDisplay] = useState(text);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const shouldReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (shouldReduce) {
            setDisplay(text);
            return;
        }

        let frame = 0;
        intervalRef.current = setInterval(() => {
            frame++;
            const chars = text.split("").map((char, i) => {
                if (char === " ") return " ";
                if (Math.random() < 0.08) {
                    return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
                }
                return char;
            });
            setDisplay(chars.join(""));

            if (frame % 20 === 0) {
                setDisplay(text);
            }
        }, glitchInterval);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [text, glitchInterval]);

    return (
        <Tag
            className={`font-grotesque ${className}`}
            aria-label={text}
            role="heading"
        >
            {display}
        </Tag>
    );
}
