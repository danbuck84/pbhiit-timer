import { Bike, Trophy, History as HistoryIcon, Sun, Moon, LogOut, Info, User, Globe } from 'lucide-react';
import FixedHeader from './FixedHeader';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
    children: React.ReactNode;
    currentView: string;
    onNavigate: (view: string) => void;
}

export default function Layout({ children, currentView, onNavigate }: LayoutProps) {
    const { theme, toggleTheme } = useTheme();
    const { logout } = useAuth();

    return (
        <div className="min-h-screen pb-24">
            <FixedHeader
                title={
                    <button onClick={() => onNavigate('home')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="p-2 rounded-lg bg-orange-600">
                            <Bike className="text-white" size={24} />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight italic dark:text-white">PB <span className="text-orange-500">HIIT</span></h1>
                    </button>
                }
                rightActions={
                    <>
                        <button onClick={() => onNavigate('profile')} className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                            <User size={20} />
                        </button>
                        <button onClick={() => onNavigate('about')} className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                            <Info size={20} />
                        </button>
                        <button onClick={toggleTheme} className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button onClick={logout} className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                            <LogOut size={20} />
                        </button>
                    </>
                }
            />

            {children}

            <div className="fixed bottom-0 left-0 right-0 p-4 border-t flex justify-around bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 z-50">
                <button
                    onClick={() => onNavigate('home')}
                    className={`flex flex-col items-center gap-1 ${currentView === 'home' ? 'text-orange-500' : 'text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white'}`}
                >
                    <Bike size={24} />
                    <span className="text-xs font-bold">Treinar</span>
                </button>
                <button
                    onClick={() => onNavigate('global')}
                    className={`flex flex-col items-center gap-1 ${currentView === 'global' ? 'text-orange-500' : 'text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white'}`}
                >
                    <Globe size={24} />
                    <span className="text-xs font-medium">Comunidade</span>
                </button>
                <button
                    onClick={() => onNavigate('ranking')}
                    className={`flex flex-col items-center gap-1 ${currentView === 'ranking' ? 'text-orange-500' : 'text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white'}`}
                >
                    <Trophy size={24} />
                    <span className="text-xs font-medium">Ranking</span>
                </button>
                <button
                    onClick={() => onNavigate('history')}
                    className={`flex flex-col items-center gap-1 ${currentView === 'history' ? 'text-orange-500' : 'text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white'}`}
                >
                    <HistoryIcon size={24} />
                    <span className="text-xs font-medium">Histórico</span>
                </button>
            </div>
        </div>
    );
}
