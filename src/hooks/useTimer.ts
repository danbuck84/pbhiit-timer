import { useState, useEffect, useRef, useCallback } from 'react';
import type { Program, AudioMode } from '../types';
import { useAudio } from './useAudio';

export function useTimer(program: Program | null, audioMode: AudioMode, onComplete: () => void) {
    const [isRunning, setIsRunning] = useState(false);
    const [currentIntervalIndex, setCurrentIntervalIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);

    const timerRef = useRef<number | null>(null);
    const { playTone, speak } = useAudio();

    // Initialize or Reset when program changes
    useEffect(() => {
        if (program) {
            setTimeLeft(program.intervals[0].duration);
            setCurrentIntervalIndex(0);
            setIsRunning(false);
        }
    }, [program]);

    // Timer Logic with Drift Correction
    useEffect(() => {
        if (!isRunning || !program) {
            if (timerRef.current) clearTimeout(timerRef.current);
            return;
        }

        let expected = Date.now() + 1000;

        const tick = () => {
            const drift = Date.now() - expected;
            expected += 1000;

            setTimeLeft(prev => {
                // Audio Cues based on PREVIOUS value (which is current second before decrement)
                // Actually, we want to cue when 3, 2, 1 seconds remain.
                // If prev is 4, we are ticking to 3.
                if (prev === 4 && audioMode === 'voice') speak("Prepare-se");
                if (prev <= 4 && prev > 1) { // 3, 2, 1
                    if (audioMode === 'beep' && prev <= 4) {
                        // Logic: if prev is 4, next is 3. We want beep at 3, 2, 1.
                        // So if prev is 4, 3, 2.
                        // Let's adjust:
                        // If prev is 4, we are about to show 3.
                    }
                }
                // Let's do audio in the effect that watches timeLeft
                return prev - 1;
            });

            timerRef.current = window.setTimeout(tick, Math.max(0, 1000 - drift));
        };

        timerRef.current = window.setTimeout(tick, 1000);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isRunning, program]);

    // Handle Interval Switching and Audio
    useEffect(() => {
        if (!program) return;

        // Audio Cues
        if (isRunning && timeLeft > 0 && timeLeft <= 3) {
            if (audioMode === 'beep') playTone(440, 'sine', 0.1);
        }
        // Voice cue handled in tick? Or here?
        // If we do it here, it runs when timeLeft updates.
        // If timeLeft becomes 3, we beep.

        if (timeLeft === 0 && isRunning) {
            const nextIdx = currentIntervalIndex + 1;
            if (nextIdx < program.intervals.length) {
                const nextInt = program.intervals[nextIdx];
                setCurrentIntervalIndex(nextIdx);
                setTimeLeft(nextInt.duration);

                if (audioMode === 'voice') speak(nextInt.name);
                else if (audioMode === 'beep') playTone(880, 'square', 0.3);
            } else {
                setIsRunning(false);
                onComplete();
            }
        }
    }, [timeLeft, isRunning, program, currentIntervalIndex, audioMode, playTone, speak, onComplete]);

    const togglePlay = useCallback(() => setIsRunning(p => !p), []);

    const reset = useCallback(() => {
        setIsRunning(false);
        if (program) {
            setCurrentIntervalIndex(0);
            setTimeLeft(program.intervals[0].duration);
        }
    }, [program]);

    const next = useCallback(() => {
        if (!program) return;
        const nextIdx = currentIntervalIndex + 1;
        if (nextIdx < program.intervals.length) {
            setCurrentIntervalIndex(nextIdx);
            setTimeLeft(program.intervals[nextIdx].duration);
        } else {
            setIsRunning(false);
            onComplete();
        }
    }, [program, currentIntervalIndex, onComplete]);

    const previous = useCallback(() => {
        if (!program) return;
        const prevIdx = currentIntervalIndex - 1;
        if (prevIdx >= 0) {
            setCurrentIntervalIndex(prevIdx);
            setTimeLeft(program.intervals[prevIdx].duration);
        } else {
            // If at start, just reset current
            setTimeLeft(program.intervals[0].duration);
        }
    }, [program, currentIntervalIndex]);

    return {
        isRunning,
        currentIntervalIndex,
        timeLeft,
        togglePlay,
        reset,
        next,
        previous,
        setIsRunning // Exported for manual control if needed
    };
}
