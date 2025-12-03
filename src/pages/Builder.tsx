import { useState, useEffect } from 'react';
import { Minus, Plus, Save, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import type { Interval, Intensity, Position, Program } from '../types';
import { Button } from '../components/Button';

interface BuilderProps {
    onNavigate: (view: string) => void;
    editProgram?: Program;
}

interface Stage {
    id: string;
    duration: number;
    intensity: Intensity;
    rpm: number;
    position: Position;
}

export default function Builder({ onNavigate, editProgram }: BuilderProps) {
    const { saveProgram, updateProgram } = useData();
    const [buildName, setBuildName] = useState('Meu Treino');

    // Stages State
    const [workStages, setWorkStages] = useState<Stage[]>([
        { id: '1', duration: 30, intensity: 'moderate', rpm: 80, position: 'seated' }
    ]);

    const [buildRest, setBuildRest] = useState(30);
    const [buildRounds, setBuildRounds] = useState(10);
    const [buildWarmup, setBuildWarmup] = useState(180);
    const [buildCooldown, setBuildCooldown] = useState(180);

    // Initialize from editProgram
    useEffect(() => {
        if (editProgram) {
            setBuildName(editProgram.name);

            const intervals = editProgram.intervals;
            let startIndex = 0;
            let endIndex = intervals.length;

            // Warmup
            if (intervals[0].type === 'warmup') {
                setBuildWarmup(intervals[0].duration);
                startIndex = 1;
            } else {
                setBuildWarmup(0);
            }

            // Cooldown
            if (intervals[intervals.length - 1].type === 'cooldown') {
                setBuildCooldown(intervals[intervals.length - 1].duration);
                endIndex = intervals.length - 1;
            } else {
                setBuildCooldown(0);
            }

            // Analyze Core Structure (Work + Rest)
            const coreIntervals = intervals.slice(startIndex, endIndex);

            if (coreIntervals.length > 0) {
                let detectedStages: Interval[] = [];
                let detectedRounds = 1;
                let detectedRest = 0;

                // Strategy 1: Look for Rest intervals as delimiters
                const restIndices = coreIntervals.map((int, idx) => int.type === 'rest' ? idx : -1).filter(idx => idx !== -1);

                if (restIndices.length > 0) {
                    // Check if rests are evenly spaced
                    // We assume the structure: [WorkBlock, Rest, WorkBlock, Rest, ...]
                    // The first rest should be at index = WorkBlock.length
                    const firstRestIdx = restIndices[0];
                    detectedRest = coreIntervals[firstRestIdx].duration;

                    // The block of stages is everything before the first rest
                    const potentialStages = coreIntervals.slice(0, firstRestIdx);

                    // Verify if this pattern repeats
                    // Total length of one round = stages.length + 1 (rest)
                    const roundLength = potentialStages.length + 1;
                    const totalRounds = coreIntervals.length / roundLength;

                    if (Number.isInteger(totalRounds)) {
                        detectedStages = potentialStages;
                        detectedRounds = totalRounds;
                    } else {
                        // Fallback: irregular structure, treat as 1 round
                        detectedStages = coreIntervals.filter(i => i.type === 'work');
                        detectedRounds = 1;
                        detectedRest = 0; // Complex to handle irregular rests, defaulting to 0 for builder simplicity
                    }
                } else {
                    // Strategy 2: No Rest intervals. Look for repeating patterns in Work intervals.
                    // We try to find the smallest repeating sequence.
                    const len = coreIntervals.length;
                    let foundPattern = false;

                    // Try divisors of total length as potential round counts
                    for (let r = len; r >= 1; r--) {
                        if (len % r === 0) {
                            const stageCount = len / r;
                            // Candidate stages
                            const candidate = coreIntervals.slice(0, stageCount);

                            // Check if this candidate repeats r times
                            let matches = true;
                            for (let i = 0; i < r; i++) {
                                for (let j = 0; j < stageCount; j++) {
                                    const current = coreIntervals[i * stageCount + j];
                                    const template = candidate[j];
                                    if (
                                        current.duration !== template.duration ||
                                        current.intensity !== template.intensity ||
                                        current.rpm !== template.rpm ||
                                        current.position !== template.position
                                    ) {
                                        matches = false;
                                        break;
                                    }
                                }
                                if (!matches) break;
                            }

                            if (matches) {
                                detectedStages = candidate;
                                detectedRounds = r;
                                foundPattern = true;
                                break; // Found the largest number of rounds (smallest stage block)
                            }
                        }
                    }

                    if (!foundPattern) {
                        detectedStages = coreIntervals;
                        detectedRounds = 1;
                    }
                }

                setBuildRounds(detectedRounds);
                setBuildRest(detectedRest);

                // Map detectedStages to Stage[]
                const newStages: Stage[] = detectedStages.map((int, idx) => ({
                    id: Date.now().toString() + idx,
                    duration: int.duration,
                    intensity: int.intensity || 'moderate',
                    rpm: int.rpm || 80,
                    position: int.position || 'seated'
                }));

                if (newStages.length > 0) {
                    setWorkStages(newStages);
                }
            }
        }
    }, [editProgram]);

    const addStage = () => {
        setWorkStages([...workStages, {
            id: Date.now().toString(),
            duration: 30,
            intensity: 'moderate',
            rpm: 80,
            position: 'seated'
        }]);
    };

    const removeStage = (id: string) => {
        if (workStages.length > 1) {
            setWorkStages(workStages.filter(s => s.id !== id));
        }
    };

    const updateStage = (id: string, field: keyof Stage, value: Stage[keyof Stage]) => {
        setWorkStages(workStages.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleSave = async () => {
        const intervals: Interval[] = [];
        if (buildWarmup > 0) intervals.push({ type: 'warmup', duration: buildWarmup, name: 'Aquecimento' });

        for (let i = 0; i < buildRounds; i++) {
            // Add all stages for this round
            workStages.forEach((stage, index) => {
                intervals.push({
                    type: 'work',
                    duration: stage.duration,
                    name: `Round ${i + 1} - Estágio ${index + 1} `,
                    intensity: stage.intensity,
                    rpm: stage.rpm,
                    position: stage.position
                });
            });

            if (buildRest > 0) intervals.push({ type: 'rest', duration: buildRest, name: 'Recuperação Ativa' });
        }

        if (buildCooldown > 0) intervals.push({ type: 'cooldown', duration: buildCooldown, name: 'Cool Down' });

        const programData = {
            name: buildName,
            intervals,
            totalTime: intervals.reduce((a, b) => a + b.duration, 0),
            isCustom: true
        };

        if (editProgram) {
            await updateProgram(editProgram.id, programData);
        } else {
            await saveProgram(programData);
        }

        onNavigate('home');
    };

    return (
        <div className="p-6 flex flex-col min-h-screen max-w-lg mx-auto pb-32">
            <div className="flex-1 space-y-6 w-full">
                <div>
                    <label className="text-sm font-medium opacity-70 mb-2 block dark:text-slate-300">Nome do Treino</label>
                    <input
                        type="text"
                        value={buildName}
                        onChange={(e) => setBuildName(e.target.value)}
                        className="w-full p-4 rounded-xl text-lg font-bold outline-none ring-2 ring-transparent focus:ring-orange-500 bg-slate-200 dark:bg-slate-800 dark:text-white"
                    />
                </div>

                {/* Warmup */}
                <div className="p-4 rounded-xl flex justify-between items-center bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
                    <span className="font-medium dark:text-white">Aquecimento</span>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setBuildWarmup(Math.max(0, buildWarmup - 30))} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600"><Minus size={18} /></button>
                        <span className="w-12 text-center font-bold text-xl dark:text-white">{buildWarmup}</span>
                        <button onClick={() => setBuildWarmup(buildWarmup + 30)} className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600"><Plus size={18} /></button>
                    </div>
                </div>

                {/* Work Stages Card */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                        <span className="font-bold text-lg dark:text-white">Esforço (Work)</span>
                        <span className="text-xs font-medium text-slate-500">{workStages.length} estágio(s)</span>
                    </div>

                    {workStages.map((stage, index) => (
                        <div key={stage.id} className="space-y-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 relative">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Estágio {index + 1}</span>
                                {workStages.length > 1 && (
                                    <button onClick={() => removeStage(stage.id)} className="text-slate-400 hover:text-red-500 p-1 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Duration */}
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Duração</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateStage(stage.id, 'duration', Math.max(5, stage.duration - 5))} className="p-1 rounded bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"><Minus size={14} /></button>
                                    <span className="w-8 text-center font-bold text-lg dark:text-white">{stage.duration}s</span>
                                    <button onClick={() => updateStage(stage.id, 'duration', stage.duration + 5)} className="p-1 rounded bg-orange-500 text-white shadow-sm hover:bg-orange-600"><Plus size={14} /></button>
                                </div>
                            </div>

                            {/* Intensity & Position */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Intensidade</label>
                                    <div className="flex gap-1">
                                        {(['light', 'moderate', 'heavy'] as const).map((int) => (
                                            <button
                                                key={int}
                                                onClick={() => updateStage(stage.id, 'intensity', int)}
                                                className={`flex-1 h-7 rounded text-[10px] font-bold transition-all ${stage.intensity === int
                                                    ? (int === 'light' ? 'bg-green-500 text-white shadow-sm' : int === 'moderate' ? 'bg-yellow-500 text-white shadow-sm' : 'bg-red-500 text-white shadow-sm')
                                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700'
                                                    }`}
                                            >
                                                {int === 'light' ? 'LEVE' : int === 'moderate' ? 'MOD' : 'PESADO'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Posição</label>
                                    <div className="flex bg-slate-200 dark:bg-slate-800 rounded p-0.5">
                                        <button
                                            onClick={() => updateStage(stage.id, 'position', 'seated')}
                                            className={`flex-1 rounded py-1 text-[10px] font-bold transition-all ${stage.position === 'seated' ? 'bg-white dark:bg-slate-600 shadow-sm dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                        >
                                            Sentado
                                        </button>
                                        <button
                                            onClick={() => updateStage(stage.id, 'position', 'standing')}
                                            className={`flex-1 rounded py-1 text-[10px] font-bold transition-all ${stage.position === 'standing' ? 'bg-white dark:bg-slate-600 shadow-sm dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                        >
                                            Em Pé
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* RPM */}
                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 flex justify-between">
                                    <span>RPM Alvo</span>
                                    <span className="text-slate-900 dark:text-white font-mono">{stage.rpm}</span>
                                </label>
                                <input
                                    type="range"
                                    min="50"
                                    max="130"
                                    step="5"
                                    value={stage.rpm}
                                    onChange={(e) => updateStage(stage.id, 'rpm', Number(e.target.value))}
                                    className="w-full accent-orange-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={addStage}
                        className="w-full py-3 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> Adicionar Estágio
                    </button>
                </div>

                {/* Rest, Rounds, Cool Down */}
                {[
                    { l: 'Recuperação Ativa', v: buildRest, s: setBuildRest, d: 5 },
                    { l: 'Rounds', v: buildRounds, s: setBuildRounds, d: 1 },
                    { l: 'Cool Down', v: buildCooldown, s: setBuildCooldown, d: 30 },
                ].map((item, i) => (
                    <div key={i} className="p-4 rounded-xl flex justify-between items-center bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
                        <span className="font-medium dark:text-white">{item.l}</span>
                        <div className="flex items-center gap-3">
                            <button onClick={() => item.s(Math.max(0, item.v - item.d))} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600"><Minus size={18} /></button>
                            <span className="w-12 text-center font-bold text-xl dark:text-white">{item.v}</span>
                            <button onClick={() => item.s(item.v + item.d)} className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600"><Plus size={18} /></button>
                        </div>
                    </div>
                ))}
            </div>

            <Button onClick={handleSave} size="lg" className="mt-8 w-full">
                <Save size={20} /> {editProgram ? 'ATUALIZAR TREINO' : 'SALVAR TREINO'}
            </Button>
        </div>
    );
}

