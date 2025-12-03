
import { Trophy, User } from 'lucide-react';
import { useData } from '../context/DataContext';



export default function Ranking() {
    const { globalHistory } = useData();

    // Aggregate data by user
    const userStats = globalHistory.reduce((acc, log) => {
        const userId = log.userId;
        if (!acc[userId]) {
            acc[userId] = {
                name: log.userName || 'Anônimo',
                photo: log.userPhoto,
                totalWorkouts: 0,
                totalMinutes: 0
            };
        }
        acc[userId].totalWorkouts += 1;
        acc[userId].totalMinutes += log.duration / 60;
        return acc;
    }, {} as Record<string, { name: string; photo?: string; totalWorkouts: number; totalMinutes: number }>);

    const ranking = Object.values(userStats).sort((a, b) => b.totalMinutes - a.totalMinutes);

    return (
        <div className="p-6 min-h-screen max-w-lg mx-auto">
            <div className="space-y-4">
                {ranking.length === 0 ? (
                    <div className="text-center opacity-50 mt-20 dark:text-white">
                        <Trophy size={48} className="mx-auto mb-4" />
                        <p>Nenhum dado disponível ainda.</p>
                    </div>
                ) : (
                    ranking.map((user, index) => (
                        <div key={index} className="p-4 rounded-xl border flex items-center gap-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-full ${index === 0 ? 'bg-yellow-500 text-white' : (index === 1 ? 'bg-gray-400 text-white' : (index === 2 ? 'bg-orange-700 text-white' : 'bg-slate-100 dark:bg-slate-700 dark:text-white'))}`}>
                                {index + 1}
                            </div>

                            {user.photo ? (
                                <img src={user.photo} alt={user.name} className="w-12 h-12 rounded-full" />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                    <User size={24} className="text-slate-500 dark:text-slate-400" />
                                </div>
                            )}

                            <div className="flex-1">
                                <h4 className="font-bold dark:text-white">{user.name}</h4>
                                <p className="text-xs opacity-60 dark:text-slate-400">
                                    {user.totalWorkouts} treinos
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-orange-500 font-bold">{Math.floor(user.totalMinutes)} min</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
