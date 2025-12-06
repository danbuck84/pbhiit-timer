import { useState } from 'react';
import { RotateCcw, Play, Pause, Volume2, VolumeX, Mic, Gauge, ArrowUp, ArrowDown, SkipBack, SkipForward } from 'lucide-react';
import type { Program, PhaseType, AudioMode } from '../types';
import { useTimer } from '../hooks/useTimer';
import { useData } from '../context/DataContext';

interface ActiveWorkoutProps {
    program: Program;
    onComplete: () => void;
    onExit: () => void;
}

export default function ActiveWorkout({ program, onComplete, onExit }: ActiveWorkoutProps) {
    const { saveHistory } = useData();
    const [audioMode, setAudioMode] = useState<AudioMode>('beep');

    const handleFinish = () => {
        saveHistory(program);
        onComplete();
    };

    const { isRunning, currentIntervalIndex, timeLeft, togglePlay, next, previous } = useTimer(program, audioMode, handleFinish);

    const currentInterval = program.intervals[currentIntervalIndex];

    const getPhaseColor = (p: PhaseType, intensity?: 'light' | 'moderate' | 'heavy') => {
        if (p === 'work' && intensity) {
            switch (intensity) {
                case 'light': return 'bg-green-600';
                case 'moderate': return 'bg-yellow-500';
                case 'heavy': return 'bg-red-600';
            }
        }
        switch (p) {
            case 'work': return 'bg-red-600';
            case 'rest': return 'bg-emerald-600';
            case 'warmup': return 'bg-yellow-500';
            case 'cooldown': return 'bg-blue-500';
            default: return 'bg-blue-600';
        }
    };

    const calculateElapsedTime = () => {
        let elapsed = 0;
        for (let i = 0; i < currentIntervalIndex; i++) {
            elapsed += program.intervals[i].duration;
        }
        if (program.intervals[currentIntervalIndex]) {
            elapsed += (program.intervals[currentIntervalIndex].duration - timeLeft);
        }
        return Math.max(0, elapsed);
    };

    const handleExitClick = async () => {
        const elapsed = calculateElapsedTime();
        // Save if at least 1 second passed and not finished
        if (elapsed > 1 && elapsed < program.totalTime) {
            await saveHistory(program, elapsed);
        }
        onExit();
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const toggleAudio = () => {
        setAudioMode(prev => prev === 'beep' ? 'voice' : (prev === 'voice' ? 'mute' : 'beep'));
    };

    return (
        <div className="fixed inset-0 flex flex-col transition-colors duration-500 bg-white dark:bg-slate-950">
            {/* Header */}
            <div className="p-6 flex justify-between items-center z-10">
                <button onClick={handleExitClick} className="p-2 rounded-full backdrop-blur-md bg-black/5 dark:bg-white/10 text-black dark:text-white">
                    <RotateCcw size={24} />
                </button>
                <div className="font-bold uppercase tracking-widest text-black/50 dark:text-white/50">
                    {program.name}
                </div>
                <button onClick={toggleAudio} className="p-2 rounded-full backdrop-blur-md bg-black/5 dark:bg-white/10 text-black dark:text-white">
                    {audioMode === 'beep' ? <Volume2 size={24} /> : (audioMode === 'voice' ? <Mic size={24} /> : <VolumeX size={24} />)}
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
                <div className={`absolute inset-0 opacity-20 transition-colors duration-500 ${getPhaseColor(currentInterval.type, currentInterval.intensity)}`} />

                <div className={`relative z-10 px-8 py-3 rounded-full font-black text-2xl uppercase tracking-[0.2em] mb-8 shadow-xl text-white ${getPhaseColor(currentInterval.type, currentInterval.intensity)}`}>
                    {currentInterval.name}
                </div>

                {/* Spinning Metrics */}
                {(currentInterval.rpm || currentInterval.intensity) && (
                    <div className="flex items-center gap-8 mb-4 z-10">
                        {currentInterval.rpm && (
                            <div className="flex flex-col items-center">
                                <span className="text-xs uppercase font-bold text-slate-400 mb-1">RPM</span>
                                <div className="flex items-center gap-2 text-3xl font-black text-slate-800 dark:text-white">
                                    <Gauge size={24} className="text-orange-500" />
                                    {currentInterval.rpm}
                                </div>
                            </div>
                        )}
                        {currentInterval.intensity && (
                            <div className="flex flex-col items-center">
                                <span className="text-xs uppercase font-bold text-slate-400 mb-1">Carga</span>
                                <div className={`px-3 py-1 rounded-lg text-sm font-bold uppercase text-white ${currentInterval.intensity === 'light' ? 'bg-green-500' :
                                    currentInterval.intensity === 'moderate' ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}>
                                    {currentInterval.intensity === 'light' ? 'Leve' :
                                        currentInterval.intensity === 'moderate' ? 'Moderada' : 'Pesada'}
                                </div>
                            </div>
                        )}
                        {currentInterval.position && (
                            <div className="flex flex-col items-center">
                                <span className="text-xs uppercase font-bold text-slate-400 mb-1">Posição</span>
                                <div className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
                                    {currentInterval.position === 'standing' ? <ArrowUp size={24} className="text-orange-500" /> : <ArrowDown size={24} className="text-blue-500" />}
                                    {currentInterval.position === 'standing' ? 'Em Pé' : 'Sentado'}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="text-[9rem] sm:text-[12rem] font-black leading-none tracking-tighter tabular-nums z-10 text-slate-900 dark:text-white">
                    {formatTime(timeLeft)}
                </div>

                {/* Next Up */}
                {currentIntervalIndex + 1 < program.intervals.length && (
                    <div className="mt-12 text-center z-10 animate-pulse text-black/50 dark:text-white/50">
                        <p className="text-xs uppercase font-bold tracking-widest mb-1">Próximo</p>
                        <p className="font-bold text-xl">
                            {program.intervals[currentIntervalIndex + 1].name}
                        </p>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="p-10 pb-16 flex items-center justify-center gap-8 z-10">
                <button
                    onClick={previous}
                    className="p-4 rounded-full bg-white/10 text-slate-900 dark:text-white hover:bg-white/20 active:scale-95 transition-all"
                >
                    <SkipBack size={32} fill="currentColor" />
                </button>

                <button
                    onClick={togglePlay}
                    className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 ${isRunning
                        ? 'bg-white text-slate-900 border-2 border-slate-200 dark:bg-slate-800 dark:text-white dark:border-slate-700'
                        : 'bg-orange-600 text-white hover:bg-orange-500'
                        }`}
                >
                    {isRunning ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
                </button>

                <button
                    onClick={next}
                    className="p-4 rounded-full bg-white/10 text-slate-900 dark:text-white hover:bg-white/20 active:scale-95 transition-all"
                >
                    <SkipForward size={32} fill="currentColor" />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="h-3 bg-gray-200 dark:bg-gray-800 w-full fixed bottom-0 left-0">
                <div
                    className="h-full bg-orange-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${((currentIntervalIndex) / (program.intervals.length || 1)) * 100}%` }}
                />
            </div>
        </div>
    );
}
