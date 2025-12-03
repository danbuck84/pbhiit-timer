
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';



export default function History() {
    const { history } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);

    const hasWorkout = (day: number) => {
        return history.some(log => {
            if (!log.completedAt) return false;
            const logDate = log.completedAt instanceof Timestamp ? log.completedAt.toDate() : new Date((log.completedAt as { seconds: number }).seconds * 1000);
            return logDate.getDate() === day &&
                logDate.getMonth() === currentDate.getMonth() &&
                logDate.getFullYear() === currentDate.getFullYear();
        });
    };

    const changeMonth = (delta: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
    };

    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        .replace(' De ', ' de ');

    return (
        <div className="p-6 min-h-screen max-w-lg mx-auto">
            {/* Calendar */}
            <div className="mb-8 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded dark:text-white"><ChevronLeft /></button>
                    <h3 className="font-bold capitalize dark:text-white">{monthName}</h3>
                    <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded dark:text-white"><ChevronRight /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                        <div key={i} className="text-slate-400 font-medium">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array(days).fill(null).map((_, i) => {
                        const day = i + 1;
                        const active = hasWorkout(day);
                        return (
                            <div key={day} className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium
                                ${active ? 'bg-orange-500 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}
                            `}>
                                {day}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-bold text-lg dark:text-white">Lista de Treinos</h3>
                {history.length === 0 ? (
                    <div className="text-center opacity-50 mt-10 dark:text-white">
                        <CalendarIcon size={48} className="mx-auto mb-4" />
                        <p>Nenhum treino completado ainda.</p>
                    </div>
                ) : (
                    history.map(log => (
                        <div key={log.id} className="p-4 rounded-xl border flex justify-between items-center bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
                            <div>
                                <h4 className="font-bold dark:text-white">{log.programName}</h4>
                                <p className="text-xs opacity-60 dark:text-slate-400">
                                    {log.completedAt ? (log.completedAt instanceof Timestamp ? log.completedAt.toDate() : new Date((log.completedAt as { seconds: number }).seconds * 1000)).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : 'Data desconhecida'}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-orange-500 font-bold">{Math.floor(log.duration / 60)} min</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
