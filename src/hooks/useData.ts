import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import type { Program, WorkoutLog } from '../types';

export function useData() {
    const { user } = useAuth();
    const [customPrograms, setCustomPrograms] = useState<Program[]>([]);
    const [history, setHistory] = useState<WorkoutLog[]>([]);
    const [streak, setStreak] = useState(0);

    const calculateStreak = (logs: WorkoutLog[]) => {
        if (logs.length === 0) { setStreak(0); return; }
        const today = new Date().setHours(0, 0, 0, 0);
        const uniqueDays = new Set(logs.map(l => {
            if (!l.completedAt) return 0;
            // Handle Firestore Timestamp
            const date = l.completedAt.toDate ? l.completedAt.toDate() : new Date((l.completedAt as unknown as { seconds: number }).seconds * 1000);
            return date.setHours(0, 0, 0, 0);
        }));

        let currentStreak = 0;
        let checkDay = today;

        if (!uniqueDays.has(today)) {
            checkDay -= 86400000;
            if (!uniqueDays.has(checkDay)) {
                setStreak(0);
                return;
            }
        }

        while (uniqueDays.has(checkDay)) {
            currentStreak++;
            checkDay -= 86400000;
        }
        setStreak(currentStreak);
    };

    useEffect(() => {
        if (!user) return;

        // Programs
        const progsQuery = query(collection(db, 'users', user.uid, 'programs'));
        const unsubProgs = onSnapshot(progsQuery, (snap) => {
            const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() } as Program));
            setCustomPrograms(loaded);
        });

        // History
        const histQuery = query(collection(db, 'users', user.uid, 'history'), orderBy('completedAt', 'desc'));
        const unsubHist = onSnapshot(histQuery, (snap) => {
            const logs = snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkoutLog));
            setHistory(logs);
            calculateStreak(logs);
        });

        return () => { unsubProgs(); unsubHist(); };
    }, [user]);



    const saveHistory = async (program: Program) => {
        if (!user) return;
        await addDoc(collection(db, 'users', user.uid, 'history'), {
            programName: program.name,
            duration: program.totalTime,
            completedAt: Timestamp.now(),
            userId: user.uid
        });
    };

    const deleteProgram = async (id: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'programs', id));
    };

    const saveProgram = async (program: Omit<Program, 'id'>) => {
        if (!user) return;
        await addDoc(collection(db, 'users', user.uid, 'programs'), {
            ...program,
            createdAt: Timestamp.now(),
            userId: user.uid
        });
    }

    return { customPrograms, history, streak, saveHistory, deleteProgram, saveProgram };
}
