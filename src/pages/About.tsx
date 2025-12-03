import { Bike, Heart, Zap, Clock, Info } from 'lucide-react';

export default function About() {
    return (
        <div className="p-6 flex flex-col min-h-screen max-w-lg mx-auto pb-24">
            <div className="space-y-8">
                {/* Intro Section */}
                <div className="bg-orange-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <Bike size={32} />
                        <h3 className="text-xl font-bold">PB HIIT Timer</h3>
                    </div>
                    <p className="opacity-90 leading-relaxed">
                        Seu companheiro definitivo para treinos de Spinning e HIIT.
                        Crie rotinas personalizadas, acompanhe seu progresso e supere seus limites.
                    </p>
                </div>

                {/* How to Use */}
                <section>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
                        <Info className="text-orange-500" />
                        Como Usar
                    </h3>
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h4 className="font-bold mb-2 dark:text-white">1. Escolha ou Crie</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Selecione um dos treinos prontos na tela inicial ou use o "Criar Meu Treino" para montar uma sequência personalizada.
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h4 className="font-bold mb-2 dark:text-white">2. Durante o Treino</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Siga as instruções de tela para RPM, Carga e Posição. O fundo da tela muda de cor para indicar a intensidade atual.
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h4 className="font-bold mb-2 dark:text-white">3. Acompanhe</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Seus treinos são salvos automaticamente no Histórico. Mantenha sua sequência de dias (streak) ativa!
                            </p>
                        </div>
                    </div>
                </section>

                {/* Benefits */}
                <section>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
                        <Heart className="text-red-500" />
                        Benefícios do Spinning
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                                <Heart size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold dark:text-white">Saúde Cardiovascular</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Fortalece o coração e melhora a circulação sanguínea.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                                <Zap size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold dark:text-white">Queima Calórica</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Alta queima de calorias em pouco tempo, ideal para perda de peso.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <Clock size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold dark:text-white">Baixo Impacto</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Menor estresse nas articulações comparado a corrida.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
