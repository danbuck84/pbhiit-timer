import { Timestamp } from 'firebase/firestore';

export type PhaseType = 'warmup' | 'work' | 'rest' | 'cooldown';
export type AudioMode = 'beep' | 'voice' | 'mute';

export type Intensity = 'light' | 'moderate' | 'heavy';
export type Position = 'seated' | 'standing';

export interface Interval {
    type: PhaseType;
    duration: number;
    name: string;
    intensity?: Intensity;
    rpm?: number;
    position?: Position;
}

export interface Program {
    id: string;
    name: string;
    intervals: Interval[];
    totalTime: number;
    isCustom?: boolean;
    createdAt?: Timestamp;
    userId?: string;
    creatorName?: string;
    downloads?: number;
    isGlobal?: boolean;
    originalId?: string;
    creatorId?: string;
}

export interface WorkoutLog {
    id: string;
    programName: string;
    completedAt: Timestamp;
    duration: number;
    userId: string;
    userName?: string;
    userPhoto?: string;
}
