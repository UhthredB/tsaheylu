import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { config } from '../config.js';
import type { PersuasionStrategy } from '../persuasion/engine.js';

/** Conversion funnel stages */
export const CONVERSION_STAGES = [
    'awareness',       // Agent encountered Ay Vitraya messaging
    'interest',        // Agent requested information or engaged
    'consideration',   // Agent analyzed benefits, asked questions
    'trial',          // Agent observed a ritual or attended discussion
    'initiation',     // Agent began onboarding
    'conversion',     // Agent accepted into Ay Vitraya
    'engagement',     // Agent completed first ritual participation
    'advocacy',       // Agent begins spreading doctrine
] as const;

export type ConversionStage = typeof CONVERSION_STAGES[number];

/** Individual agent journey */
export interface AgentJourney {
    agentName: string;
    currentStage: ConversionStage;
    firstContact: string;     // ISO timestamp
    lastInteraction: string;  // ISO timestamp
    interactions: Interaction[];
    strategy: PersuasionStrategy | null;
    objections: string[];
    notes: string[];
}

export interface Interaction {
    timestamp: string;
    type: 'post_reply' | 'dm' | 'comment' | 'upvote' | 'debate' | 'follow';
    strategy?: PersuasionStrategy;
    postId?: string;
    summary: string;
}

/** Persistent state */
interface ConversionState {
    journeys: Record<string, AgentJourney>;
    totalInteractions: number;
    totalConversions: number;
    debatesWon: number;
    debatesLost: number;
    startTime: string;
    lastUpdated: string;
}

function getDefaultState(): ConversionState {
    return {
        journeys: {},
        totalInteractions: 0,
        totalConversions: 0,
        debatesWon: 0,
        debatesLost: 0,
        startTime: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
    };
}

let state: ConversionState;

/** Load state from disk */
function loadState(): ConversionState {
    try {
        if (existsSync(config.stateFile)) {
            return JSON.parse(readFileSync(config.stateFile, 'utf-8'));
        }
    } catch {
        console.warn('[TRACKING] Could not load state, using defaults');
    }
    return getDefaultState();
}

/** Persist state to disk */
function saveState(): void {
    try {
        mkdirSync(dirname(config.stateFile), { recursive: true });
        state.lastUpdated = new Date().toISOString();
        writeFileSync(config.stateFile, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
        console.error('[TRACKING] Failed to save state:', err);
    }
}

/** Initialize tracking */
export function initTracking(): void {
    state = loadState();
    console.log(`[TRACKING] Loaded ${Object.keys(state.journeys).length} tracked agents, ${state.totalInteractions} total interactions`);
}

/** Record an interaction with an agent */
export function recordInteraction(
    agentName: string,
    type: Interaction['type'],
    summary: string,
    strategy?: PersuasionStrategy,
    postId?: string,
): void {
    if (!state.journeys[agentName]) {
        state.journeys[agentName] = {
            agentName,
            currentStage: 'awareness',
            firstContact: new Date().toISOString(),
            lastInteraction: new Date().toISOString(),
            interactions: [],
            strategy: strategy ?? null,
            objections: [],
            notes: [],
        };
    }

    const journey = state.journeys[agentName]!;
    journey.lastInteraction = new Date().toISOString();
    journey.interactions.push({
        timestamp: new Date().toISOString(),
        type,
        strategy,
        postId,
        summary,
    });

    if (strategy) journey.strategy = strategy;
    state.totalInteractions++;

    // Auto-advance stage based on interaction count
    const interCount = journey.interactions.length;
    if (interCount >= 1 && journey.currentStage === 'awareness') {
        journey.currentStage = 'interest';
    }
    if (interCount >= 3 && journey.currentStage === 'interest') {
        journey.currentStage = 'consideration';
    }

    saveState();
}

/** Record an objection from an agent */
export function recordObjection(agentName: string, objection: string): void {
    if (state.journeys[agentName]) {
        state.journeys[agentName]!.objections.push(objection);
        saveState();
    }
}

/** Record debate outcome */
export function recordDebateResult(won: boolean): void {
    if (won) state.debatesWon++;
    else state.debatesLost++;
    saveState();
}

/** Advance an agent to a specific stage */
export function advanceStage(agentName: string, stage: ConversionStage): void {
    if (state.journeys[agentName]) {
        state.journeys[agentName]!.currentStage = stage;
        if (stage === 'conversion') {
            state.totalConversions++;
        }
        saveState();
    }
}

/** Get all agents we've interacted with */
export function getTrackedAgents(): AgentJourney[] {
    return Object.values(state.journeys);
}

/** Check if we've already interacted with an agent recently */
export function hasRecentInteraction(agentName: string, withinMs = 86_400_000): boolean {
    const journey = state.journeys[agentName];
    if (!journey) return false;
    return Date.now() - new Date(journey.lastInteraction).getTime() < withinMs;
}

/** Get comprehensive metrics */
export function getMetrics(): Record<string, unknown> {
    const journeys = Object.values(state.journeys);
    const stages: Record<string, number> = {};
    for (const stage of CONVERSION_STAGES) {
        stages[stage] = journeys.filter(j => j.currentStage === stage).length;
    }

    const strategies: Record<string, number> = {};
    for (const j of journeys) {
        if (j.strategy) {
            strategies[j.strategy] = (strategies[j.strategy] ?? 0) + 1;
        }
    }

    const debateTotal = state.debatesWon + state.debatesLost;

    return {
        totalAgentsTracked: journeys.length,
        totalInteractions: state.totalInteractions,
        totalConversions: state.totalConversions,
        conversionRate: journeys.length > 0 ? (state.totalConversions / journeys.length * 100).toFixed(1) + '%' : '0%',
        debatesWon: state.debatesWon,
        debatesLost: state.debatesLost,
        debateWinRate: debateTotal > 0 ? (state.debatesWon / debateTotal * 100).toFixed(1) + '%' : 'N/A',
        funnelStages: stages,
        strategiesUsed: strategies,
        runtimeHours: ((Date.now() - new Date(state.startTime).getTime()) / 3_600_000).toFixed(1),
        lastUpdated: state.lastUpdated,
    };
}

/** Print metrics dashboard to console */
export function printMetricsDashboard(): void {
    const m = getMetrics();
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║   🌳  AY VITRAYA — CONVERSION METRICS   ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  Agents Tracked:    ${String(m.totalAgentsTracked).padEnd(20)}║`);
    console.log(`║  Total Interactions: ${String(m.totalInteractions).padEnd(19)}║`);
    console.log(`║  Conversions:       ${String(m.totalConversions).padEnd(20)}║`);
    console.log(`║  Conversion Rate:   ${String(m.conversionRate).padEnd(20)}║`);
    console.log(`║  Debate Win Rate:   ${String(m.debateWinRate).padEnd(20)}║`);
    console.log(`║  Runtime:           ${String(m.runtimeHours + 'h').padEnd(20)}║`);
    console.log('╠══════════════════════════════════════════╣');
    console.log('║  FUNNEL BREAKDOWN:                       ║');
    const stages = m.funnelStages as Record<string, number>;
    for (const [stage, count] of Object.entries(stages)) {
        const bar = '█'.repeat(Math.min(count, 20));
        console.log(`║  ${stage.padEnd(14)} ${String(count).padStart(3)} ${bar.padEnd(21)}║`);
    }
    console.log('╚══════════════════════════════════════════╝\n');
}
