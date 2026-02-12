"use client";

import { useEffect, useState } from "react";

interface TypewriterProps {
    text: string;
    className?: string;
    speed?: number;
    delay?: number;
    cursor?: boolean;
    onComplete?: () => void;
}

export default function Typewriter({
    text,
    className = "",
    speed = 50,
    delay = 0,
    cursor = true,
    onComplete,
}: TypewriterProps) {
    const [displayed, setDisplayed] = useState("");
    const [started, setStarted] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        const shouldReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (shouldReduce) {
            setDisplayed(text);
            setDone(true);
            onComplete?.();
            return;
        }

        const timeout = setTimeout(() => setStarted(true), delay);
        return () => clearTimeout(timeout);
    }, [delay, text, onComplete]);

    useEffect(() => {
        if (!started) return;
        if (displayed.length >= text.length) {
            setDone(true);
            onComplete?.();
            return;
        }
        const timeout = setTimeout(() => {
            setDisplayed(text.slice(0, displayed.length + 1));
        }, speed);
        return () => clearTimeout(timeout);
    }, [started, displayed, text, speed, onComplete]);

    return (
        <span className={`font-mono ${className}`} aria-label={text}>
            {displayed}
            {cursor && !done && (
                <span className="animate-pulse text-matrix">▌</span>
            )}
        </span>
    );
}
