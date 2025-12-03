import { useState } from 'react';
import { User, Save, Activity, Heart, Zap } from 'lucide-react';
import { Button } from '../components/Button';

interface ProfileProps {
    onNavigate: (view: string) => void;
}

interface UserStats {
    age: string;
    gender: 'male' | 'female' | 'other';
    height: string; // cm
    weight: string; // kg
}

export default function Profile({ onNavigate }: ProfileProps) {
    const [stats, setStats] = useState<UserStats>(() => {
        const saved = localStorage.getItem('user_stats');
        return saved ? JSON.parse(saved) : {
            age: '',
            gender: 'male',
            height: '',
            weight: ''
        };
    });

    // Derived state for BMI
    const calculateBmi = () => {
        if (stats.height && stats.weight) {
            const h = Number(stats.height) / 100;
            const w = Number(stats.weight);
            if (h > 0 && w > 0) {
                return w / (h * h);
            }
        }
        return null;
    };

    const bmi = calculateBmi();

    const handleSave = () => {
        localStorage.setItem('user_stats', JSON.stringify(stats));
        // Could also show a toast here
        onNavigate('home');
    };

    const getBmiCategory = (bmi: number) => {
        if (bmi < 18.5) return { label: 'Abaixo do Peso', color: 'text-blue-500' };
        if (bmi < 24.9) return { label: 'Peso Normal', color: 'text-green-500' };
        if (bmi < 29.9) return { label: 'Sobrepeso', color: 'text-yellow-500' };
        return { label: 'Obesidade', color: 'text-red-500' };
    };

    const getTips = () => {
        const tips = [];
        const age = Number(stats.age);

        if (bmi) {
            if (bmi > 25) {
                tips.push({
                    icon: <Zap size={20} className="text-orange-500" />,
                    title: "Foco em Queima Calórica",
                    text: "O spinning é excelente para você! Foque em manter a frequência cardíaca na zona de queima de gordura (60-70% da FCM)."
                });
            } else {
                tips.push({
                    icon: <Activity size={20} className="text-green-500" />,
                    title: "Manutenção e Resistência",
                    text: "Use o spinning para melhorar seu condicionamento cardiovascular e tônus muscular."
                });
            }
        }

        if (age > 50) {
            tips.push({
                icon: <Heart size={20} className="text-red-500" />,
                title: "Cuidado Cardiovascular",
                text: "Monitore sua frequência cardíaca. Priorize treinos de resistência moderada em vez de picos de intensidade máxima."
            });
        }

        return tips;
    };

    const bmiInfo = bmi ? getBmiCategory(bmi) : null;

    return (
        <div className="p-6 flex flex-col min-h-screen max-w-lg mx-auto pb-24">
            <div className="space-y-6">
                {/* Stats Form */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex items-center gap-2 mb-2 dark:text-white">
                        <User className="text-orange-500" />
                        <h3 className="font-bold">Seus Dados</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Idade</label>
                            <input
                                type="number"
                                value={stats.age}
                                onChange={e => setStats({ ...stats, age: e.target.value })}
                                className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Anos"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Gênero</label>
                            <select
                                value={stats.gender}
                                onChange={e => setStats({ ...stats, gender: e.target.value as 'male' | 'female' | 'other' })}
                                className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                            >
                                <option value="male">Masculino</option>
                                <option value="female">Feminino</option>
                                <option value="other">Outro</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Altura (cm)</label>
                            <input
                                type="number"
                                value={stats.height}
                                onChange={e => setStats({ ...stats, height: e.target.value })}
                                className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="175"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Peso (kg)</label>
                            <input
                                type="number"
                                value={stats.weight}
                                onChange={e => setStats({ ...stats, weight: e.target.value })}
                                className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="70"
                            />
                        </div>
                    </div>
                </div>

                {/* Results & Tips */}
                {bmi && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-6 rounded-2xl shadow-lg flex justify-between items-center">
                            <div>
                                <p className="text-sm opacity-70 font-medium uppercase tracking-wider">Seu IMC</p>
                                <p className="text-4xl font-black">{bmi.toFixed(1)}</p>
                            </div>
                            <div className="text-right">
                                <p className={`font-bold text-lg ${bmiInfo?.color}`}>{bmiInfo?.label}</p>
                                <p className="text-xs opacity-50">Índice de Massa Corporal</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-bold text-lg dark:text-white px-1">Dicas Personalizadas</h3>
                            {getTips().map((tip, i) => (
                                <div key={i} className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30 flex gap-4">
                                    <div className="shrink-0 pt-1">
                                        {tip.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white mb-1">{tip.title}</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                            {tip.text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <Button onClick={handleSave} size="lg" className="w-full mt-8">
                    <Save size={20} /> SALVAR PERFIL
                </Button>
            </div>
        </div>
    );
}
