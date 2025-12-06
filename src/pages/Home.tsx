

import type { Program, Intensity, Position } from '../types';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Zap, Play, Trash2, Plus, Flame, Trophy, Globe, Share, Pencil, CloudOff, X, Activity } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

const PRESETS: Program[] = [
    {
        id: 'mountain_climb',
        name: 'Montanha (Força)',
        totalTime: 1800,
        intervals: [
            { type: 'warmup', duration: 300, name: 'Aquecimento' },
            ...Array(5).fill(null).flatMap((_, i) => [
                { type: 'work' as const, duration: 180, name: `Subida ${i + 1}`, intensity: 'heavy' as const, rpm: 60, position: 'standing' as const },
                { type: 'rest' as const, duration: 60, name: 'Recuperação', intensity: 'light' as const, rpm: 90, position: 'seated' as const }
            ]),
            { type: 'cooldown', duration: 300, name: 'Desaquecimento' }
        ]
    },
    {
        id: 'hiit_speed',
        name: 'HIIT (Velocidade)',
        totalTime: 1200,
        intervals: [
            { type: 'warmup', duration: 180, name: 'Aquecimento' },
            ...Array(8).fill(null).flatMap(() => [
                { type: 'work' as const, duration: 30, name: 'SPRINT', intensity: 'heavy' as const, rpm: 110, position: 'seated' as const },
                { type: 'rest' as const, duration: 90, name: 'Recuperação', intensity: 'light' as const, rpm: 80, position: 'seated' as const }
            ]),
            { type: 'cooldown', duration: 180, name: 'Desaquecimento' }
        ]
    },
    {
        id: 'endurance',
        name: 'Endurance (Resistência)',
        totalTime: 2400,
        intervals: [
            { type: 'warmup', duration: 300, name: 'Aquecimento' },
            { type: 'work' as const, duration: 1800, name: 'Cruzeiro', intensity: 'moderate' as const, rpm: 90, position: 'seated' as const },
            { type: 'cooldown', duration: 300, name: 'Desaquecimento' }
        ]
    }
];

interface HomeProps {
    onStart: (program: Program) => void;
    onNavigate: (view: string) => void;
    onEdit: (program: Program) => void;
}

interface Stage {
    duration: number;
    intensity: Intensity;
    rpm: number;
    position: Position;
}

interface WorkoutStructure {
    warmup: number;
    cooldown: number;
    rounds: number;
    rest: number;
    stages: Stage[];
}

export default function Home({ onStart, onNavigate, onEdit }: HomeProps) {
    const { user } = useAuth();
    const { customPrograms, streak, deleteProgram, publishProgram, unpublishProgram, globalPrograms } = useData();
    const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (selectedProgram) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedProgram]);

    // Parse program structure for preview
    const programStructure = useMemo((): WorkoutStructure | null => {
        if (!selectedProgram) return null;

        const intervals = selectedProgram.intervals;
        let startIndex = 0;
        let endIndex = intervals.length;
        let warmup = 0;
        let cooldown = 0;

        // Warmup
        if (intervals[0]?.type === 'warmup') {
            warmup = intervals[0].duration;
            startIndex = 1;
        }

        // Cooldown
        if (intervals[intervals.length - 1]?.type === 'cooldown') {
            cooldown = intervals[intervals.length - 1].duration;
            endIndex = intervals.length - 1;
        }

        const coreIntervals = intervals.slice(startIndex, endIndex);
        let stages: Stage[] = [];
        let rounds = 1;
        let rest = 0;

        if (coreIntervals.length > 0) {
            // Strategy 1: Look for Rest intervals
            const restIndices = coreIntervals.map((int, idx) => int.type === 'rest' ? idx : -1).filter(idx => idx !== -1);

            if (restIndices.length > 0) {
                // Check if rests are evenly spaced (pattern detection)
                const distances: number[] = [];
                for (let i = 1; i < restIndices.length; i++) {
                    distances.push(restIndices[i] - restIndices[i - 1]);
                }

                // If all distances are the same, we have a repeating pattern
                const allSame = distances.every(d => d === distances[0]);

                if (allSame || restIndices.length === 1) {
                    const firstRestIdx = restIndices[0];
                    rest = coreIntervals[firstRestIdx].duration;

                    // All work intervals before the first rest are stages
                    const potentialStages = coreIntervals.slice(0, firstRestIdx).filter(i => i.type === 'work');

                    // Calculate rounds based on number of rest intervals
                    if (restIndices.length > 0) {
                        rounds = restIndices.length;
                    }

                    stages = potentialStages.map(i => ({
                        duration: i.duration,
                        intensity: i.intensity || 'moderate',
                        rpm: i.rpm || 80,
                        position: i.position || 'seated'
                    }));
                } else {
                    // Irregular rest pattern, treat as single round
                    stages = coreIntervals.filter(i => i.type === 'work').map(i => ({
                        duration: i.duration,
                        intensity: i.intensity || 'moderate',
                        rpm: i.rpm || 80,
                        position: i.position || 'seated'
                    }));
                }
            } else {
                // Strategy 2: No Rest, look for patterns
                const len = coreIntervals.length;
                let foundPattern = false;

                // Try to find repeating patterns
                for (let r = len; r >= 1; r--) {
                    if (len % r === 0) {
                        const stageCount = len / r;
                        const candidate = coreIntervals.slice(0, stageCount);

                        // Check if this pattern repeats
                        let matches = true;
                        for (let i = 0; i < r; i++) {
                            for (let j = 0; j < stageCount; j++) {
                                const current = coreIntervals[i * stageCount + j];
                                const template = candidate[j];
                                if (current.duration !== template.duration) {
                                    matches = false;
                                    break;
                                }
                            }
                            if (!matches) break;
                        }

                        if (matches && r > 1) {
                            stages = candidate.map(i => ({
                                duration: i.duration,
                                intensity: i.intensity || 'moderate',
                                rpm: i.rpm || 80,
                                position: i.position || 'seated'
                            }));
                            rounds = r;
                            foundPattern = true;
                            break;
                        }
                    }
                }

                if (!foundPattern) {
                    // No pattern found, treat all as single round
                    stages = coreIntervals.map(i => ({
                        duration: i.duration,
                        intensity: i.intensity || 'moderate',
                        rpm: i.rpm || 80,
                        position: i.position || 'seated'
                    }));
                }
            }
        }

        return { warmup, cooldown, rounds, rest, stages };
    }, [selectedProgram]);

    return (
        <div className="p-4 pb-24 max-w-lg mx-auto">
            {/* Streak Banner */}
            <div className="mb-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-orange-100 text-sm font-medium uppercase tracking-wider mb-1">Sequência Atual</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black">{streak}</span>
                        <span className="text-xl font-medium opacity-90">dias</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm opacity-90">
                        <Flame size={16} fill="currentColor" />
                        {streak > 0 ? 'Mantenha o ritmo!' : 'Comece hoje!'}
                    </div>
                </div>
                <Trophy className="absolute -right-4 -bottom-4 text-white opacity-20" size={120} />
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                    onClick={() => onNavigate('builder')}
                    className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex flex-col items-center gap-3 text-center border-2 border-transparent hover:border-orange-500"
                >
                    <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                        <Plus size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold dark:text-white">Criar Meu Treino</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Personalizado</p>
                    </div>
                </button>

                <button
                    onClick={() => onNavigate('global')}
                    className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex flex-col items-center gap-3 text-center border-2 border-transparent hover:border-blue-500"
                >
                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <Globe size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold dark:text-white">Comunidade</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Baixar Treinos</p>
                    </div>
                </button>
            </div>

            {/* Workouts List */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Zap size={18} /> Treinos Prontos
                </h2>
                {[...PRESETS, ...customPrograms].map(p => (
                    <div key={p.id}
                        onClick={() => setSelectedProgram(p)}
                        className="w-full p-4 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 flex items-center justify-between group cursor-pointer hover:border-orange-500 transition-all shadow-sm"
                    >
                        <div>
                            <h3 className="font-bold text-lg dark:text-white">{p.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {Math.floor(p.totalTime / 60)} min • {p.intervals.length} etapas
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {p.isCustom && (
                                <>
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(p);
                                    }} className="p-2 text-slate-500 hover:bg-slate-500/10 rounded-full">
                                        <Pencil size={18} />
                                    </button>

                                    {globalPrograms.some(gp => gp.originalId === p.id && gp.creatorId === user?.uid) ? (
                                        <button onClick={async (e) => {
                                            e.stopPropagation();
                                            if (confirm(`Remover "${p.name}" da comunidade?`)) {
                                                try {
                                                    await unpublishProgram(p.id);
                                                    alert('Treino removido da comunidade.');
                                                } catch (error) {
                                                    console.error(error);
                                                }
                                            }
                                        }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full" title="Despublicar">
                                            <CloudOff size={18} />
                                        </button>
                                    ) : (
                                        <button onClick={async (e) => {
                                            e.stopPropagation();
                                            if (confirm(`Publicar "${p.name}" para a comunidade?`)) {
                                                try {
                                                    await publishProgram(p);
                                                    alert('Treino publicado com sucesso!');
                                                } catch (error) {
                                                    console.error(error);
                                                }
                                            }
                                        }} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-full" title="Publicar">
                                            <Share size={18} />
                                        </button>
                                    )}

                                    <button onClick={(e) => { e.stopPropagation(); deleteProgram(p.id); }} className="p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-full">
                                        <Trash2 size={18} />
                                    </button>
                                </>
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); onStart(p); }}
                                className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 hover:bg-orange-500 hover:text-white transition-colors"
                            >
                                <Play size={20} fill="currentColor" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Preview Modal */}
            {selectedProgram && programStructure && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[70vh] animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 shrink-0">
                            <div>
                                <h3 className="font-bold text-lg dark:text-white">{selectedProgram.name}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Visualização do Treino</p>
                            </div>
                            <button onClick={() => setSelectedProgram(null)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 dark:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-4 pb-10 space-y-4">
                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center">
                                    <span className="block text-xs text-slate-500 uppercase font-bold">Tempo</span>
                                    <span className="font-bold dark:text-white">{Math.floor(selectedProgram.totalTime / 60)}m</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center">
                                    <span className="block text-xs text-slate-500 uppercase font-bold">Rounds</span>
                                    <span className="font-bold dark:text-white">{programStructure.rounds}</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center">
                                    <span className="block text-xs text-slate-500 uppercase font-bold">Estágios</span>
                                    <span className="font-bold dark:text-white">{programStructure.stages.length}</span>
                                </div>
                            </div>

                            {/* Structure Visualization */}
                            <div className="space-y-3">
                                {programStructure.warmup > 0 && (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30">
                                        <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                                            <Flame size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <span className="font-bold text-sm dark:text-yellow-100">Aquecimento</span>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{programStructure.warmup} segundos</p>
                                        </div>
                                    </div>
                                )}

                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                    <div className="bg-slate-50 dark:bg-slate-800 p-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                        <span className="text-xs font-bold uppercase text-slate-500">Bloco Principal ({programStructure.rounds}x)</span>
                                    </div>
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {programStructure.stages.map((stage, idx) => (
                                            <div key={idx} className="p-3 flex items-center gap-3 bg-white dark:bg-slate-900">
                                                <div className={`w-1 h-8 rounded-full ${stage.intensity === 'heavy' ? 'bg-red-500' :
                                                    stage.intensity === 'moderate' ? 'bg-yellow-500' : 'bg-green-500'
                                                    }`} />
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-sm dark:text-white">Estágio {idx + 1}</span>
                                                        <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">{stage.duration}s</span>
                                                    </div>
                                                    <div className="flex gap-2 text-[10px] text-slate-500 uppercase font-bold mt-0.5">
                                                        <span>{stage.position === 'standing' ? 'Em Pé' : 'Sentado'}</span>
                                                        <span>•</span>
                                                        <span>{stage.rpm} RPM</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {programStructure.rest > 0 && (
                                            <div className="p-3 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50">
                                                <div className="w-1 h-8 rounded-full bg-blue-400" />
                                                <div className="flex-1">
                                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Recuperação</span>
                                                    <p className="text-xs text-slate-500">{programStructure.rest} segundos</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {programStructure.cooldown > 0 && (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                            <Activity size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <span className="font-bold text-sm dark:text-blue-100">Cool Down</span>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{programStructure.cooldown} segundos</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                            <button
                                onClick={() => {
                                    setSelectedProgram(null);
                                    onStart(selectedProgram);
                                }}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Play size={18} fill="currentColor" /> INICIAR TREINO
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
