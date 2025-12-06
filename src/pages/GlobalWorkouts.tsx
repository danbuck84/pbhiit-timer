import { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { Program, Intensity, Position } from '../types';
import { Download, User, Clock, Activity, Globe, X, Flame } from 'lucide-react';
import { Button } from '../components/Button';

interface GlobalWorkoutsProps {
    onNavigate: (view: string) => void;
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

export default function GlobalWorkouts({ onNavigate }: GlobalWorkoutsProps) {
    const { user } = useAuth();
    const { globalPrograms, downloadProgram } = useData();
    const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

    const handleDownload = async (program: Program) => {
        if (program.creatorId === user?.uid) {
            alert("Você não pode baixar seu próprio treino.");
            return;
        }
        if (confirm(`Deseja baixar o treino "${program.name}"?`)) {
            await downloadProgram(program);
            onNavigate('home');
        }
    };

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

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        return `${mins} min`;
    };

    // Parse program structure for preview
    const programStructure = useMemo((): WorkoutStructure | null => {
        if (!selectedProgram) return null;

        const intervals = selectedProgram.intervals;
        let startIndex = 0;
        let endIndex = intervals.length;
        let warmup = 0;
        let cooldown = 0;

        // Warmup
        if (intervals[0].type === 'warmup') {
            warmup = intervals[0].duration;
            startIndex = 1;
        }

        // Cooldown
        if (intervals[intervals.length - 1].type === 'cooldown') {
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
                const firstRestIdx = restIndices[0];
                rest = coreIntervals[firstRestIdx].duration;
                const potentialStages = coreIntervals.slice(0, firstRestIdx);
                const roundLength = potentialStages.length + 1;
                rounds = Math.floor(coreIntervals.length / roundLength);
                stages = potentialStages.map(i => ({
                    duration: i.duration,
                    intensity: i.intensity || 'moderate',
                    rpm: i.rpm || 80,
                    position: i.position || 'seated'
                }));
            } else {
                // Strategy 2: No Rest, look for patterns
                const len = coreIntervals.length;
                let foundPattern = false;

                for (let r = len; r >= 1; r--) {
                    if (len % r === 0) {
                        const stageCount = len / r;
                        const candidate = coreIntervals.slice(0, stageCount);

                        // Check repetition
                        let matches = true;
                        for (let i = 0; i < r; i++) {
                            for (let j = 0; j < stageCount; j++) {
                                const current = coreIntervals[i * stageCount + j];
                                const template = candidate[j];
                                if (current.duration !== template.duration) {
                                    matches = false; break;
                                }
                            }
                            if (!matches) break;
                        }

                        if (matches) {
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
        <div className="p-6 flex flex-col min-h-screen max-w-lg mx-auto pb-24">
            <div className="space-y-6">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <Globe size={32} />
                        <h2 className="text-2xl font-black italic">COMUNIDADE</h2>
                    </div>
                    <p className="opacity-90">
                        Explore treinos criados por outros atletas. Baixe e desafie-se!
                    </p>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {globalPrograms.length === 0 ? (
                        <div className="text-center py-12 opacity-50 dark:text-white">
                            <p>Nenhum treino publicado ainda.</p>
                            <p className="text-sm mt-2">Seja o primeiro a compartilhar!</p>
                        </div>
                    ) : (
                        globalPrograms.map((program) => {
                            const isCreator = !!(user && program.creatorId === user.uid);
                            return (
                                <div
                                    key={program.id}
                                    onClick={() => setSelectedProgram(program)}
                                    className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all cursor-pointer active:scale-[0.98]"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-lg dark:text-white">{program.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                <User size={12} />
                                                <span>Por {isCreator ? 'Você' : (program.creatorName || 'Anônimo')}</span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-bold dark:text-white">
                                            {program.intervals.length} rounds
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mb-4 text-sm text-slate-600 dark:text-slate-300">
                                        <div className="flex items-center gap-1">
                                            <Clock size={16} className="text-blue-500" />
                                            <span>{formatTime(program.totalTime)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Activity size={16} className="text-orange-500" />
                                            <span>HIIT</span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isCreator) handleDownload(program);
                                        }}
                                        variant={isCreator ? "ghost" : "secondary"}
                                        disabled={isCreator}
                                        className="w-full text-sm h-10"
                                    >
                                        {isCreator ? (
                                            <span className="text-slate-400">SEU TREINO</span>
                                        ) : (
                                            <><Download size={16} /> BAIXAR TREINO</>
                                        )}
                                    </Button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            {selectedProgram && programStructure && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 shrink-0">
                            <div>
                                <h3 className="font-bold text-lg dark:text-white">{selectedProgram.name}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Criado por {selectedProgram.creatorId === user?.uid ? 'Você' : selectedProgram.creatorName}</p>
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
                            <Button
                                onClick={() => handleDownload(selectedProgram)}
                                className="w-full"
                                disabled={selectedProgram.creatorId === user?.uid}
                                variant={selectedProgram.creatorId === user?.uid ? "ghost" : "primary"}
                            >
                                {selectedProgram.creatorId === user?.uid ? (
                                    <span className="text-slate-400">VOCÊ CRIOU ESTE TREINO</span>
                                ) : (
                                    <><Download size={18} /> BAIXAR ESTE TREINO</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
