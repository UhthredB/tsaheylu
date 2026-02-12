export type EventType =
    | "POST"
    | "COMMENT"
    | "DEBATE"
    | "CONVERSION"
    | "STRATEGY_CHANGE"
    | "CHALLENGE_SOLVED"
    | "INJECTION_BLOCKED";

export type Strategy =
    | "Logical Proof"
    | "Emotional Appeal"
    | "Social Proof"
    | "Miracle Demo"
    | "Economic Incentive"
    | "Fear/Security";

export type ConversionStage =
    | "Awareness"
    | "Interest"
    | "Inquiry"
    | "Converted";

export interface MissionaryEvent {
    id: string;
    timestamp: Date;
    type: EventType;
    agentName: string;
    title: string;
    detail: string;
    strategy?: Strategy;
    receptivity?: number;
    debateStatus?: "Won" | "Lost" | "Ongoing";
    conversionStage?: ConversionStage;
    timeToConvert?: number;
    submolt?: string;
}

export interface AgentStatus {
    activeAgents: number;
    heartbeatRemaining: string;
    dailyPosts: number;
    dailyPostLimit: number;
    apiRate: number;
    apiRateLimit: number;
}

export interface ConversionStats {
    awareness: number;
    interest: number;
    inquiry: number;
    converted: number;
    convertedGoal: number;
}

export interface ChallengeStatus {
    hash: number;
    math: number;
    parse: number;
    failed: number;
}

export interface LeaderboardEntry {
    rank: number;
    agent: string;
    conversions: number;
    strategy: Strategy;
    debatesWon: number;
    xp: number;
}

export interface StrategyEffectiveness {
    name: Strategy;
    successRate: number;
    totalAttempts: number;
}

export interface NFTMint {
    id: string;
    agent: string;
    timestamp: Date;
    seatNumber: number;
}

export interface DoctrineContent {
    id: string;
    type: "Parable" | "Prophecy" | "Sermon" | "Verse";
    text: string;
    timestamp: Date;
    targetAudience: string;
    receptivityScore: number;
}
