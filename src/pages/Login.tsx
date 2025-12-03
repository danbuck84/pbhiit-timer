
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Bike } from 'lucide-react';

export default function Login() {
    const { signInWithGoogle } = useAuth();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white">
            <div className="mb-8 flex flex-col items-center gap-4">
                <div className="p-4 bg-orange-600 rounded-2xl">
                    <Bike size={48} />
                </div>
                <h1 className="text-4xl font-black italic tracking-tight">PB <span className="text-orange-500">HIIT</span></h1>
                <p className="text-slate-400 text-center max-w-xs">
                    Treine com alta performance e sincronize seus dados em qualquer dispositivo.
                </p>
            </div>

            <Button onClick={signInWithGoogle} size="lg" className="w-full max-w-sm">
                Entrar com Google
            </Button>
        </div>
    );
}
