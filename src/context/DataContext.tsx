import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, deleteDoc, doc, Timestamp, collectionGroup, setDoc, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import type { Program, WorkoutLog } from '../types';

interface DataContextType {
    customPrograms: Program[];
    history: WorkoutLog[];
    globalHistory: WorkoutLog[];
    streak: number;
    saveHistory: (program: Program, actualDuration?: number) => Promise<void>;
    deleteProgram: (id: string) => Promise<void>;
    saveProgram: (program: Omit<Program, 'id'>) => Promise<void>;
    globalPrograms: Program[];
    publishProgram: (program: Program) => Promise<void>;
    unpublishProgram: (programId: string) => Promise<void>;
    downloadProgram: (program: Program) => Promise<void>;
    updateProgram: (id: string, program: Partial<Program>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [customPrograms, setCustomPrograms] = useState<Program[]>([]);
    const [history, setHistory] = useState<WorkoutLog[]>([]);
    const [globalHistory, setGlobalHistory] = useState<WorkoutLog[]>([]);
    const [streak, setStreak] = useState(0);

    const calculateStreak = (logs: WorkoutLog[]) => {
        if (logs.length === 0) { setStreak(0); return; }
        const today = new Date().setHours(0, 0, 0, 0);
        const uniqueDays = new Set(logs.map(l => {
            if (!l.completedAt) return 0;
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

    // Fetch User Data
    useEffect(() => {
        if (!user) {
            setCustomPrograms([]);
            setHistory([]);
            setStreak(0);
            return;
        }

        // Programs
        const progsQuery = query(collection(db, 'users', user.uid, 'programs'));
        const unsubProgs = onSnapshot(progsQuery, (snap) => {
            const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() } as Program));
            setCustomPrograms(loaded);
        });

        // Personal History
        const histQuery = query(collection(db, 'users', user.uid, 'history'), orderBy('completedAt', 'desc'));
        const unsubHist = onSnapshot(histQuery, (snap) => {
            const logs = snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkoutLog));
            setHistory(logs);
            calculateStreak(logs);
        });

        return () => { unsubProgs(); unsubHist(); };
    }, [user]);

    // Fetch Global History (Leaderboard)
    useEffect(() => {
        // Note: Collection Group queries often require an index in Firestore. 
        // If this fails, check the console for a link to create the index.
        const globalQuery = query(collectionGroup(db, 'history'), orderBy('completedAt', 'desc'));

        const unsubGlobal = onSnapshot(globalQuery, (snap) => {
            const logs = snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkoutLog));
            setGlobalHistory(logs);
        }, (error) => {
            console.error("Global history error (check indexes):", error);
        });

        return () => unsubGlobal();
    }, []);



    const saveHistory = async (program: Program, actualDuration?: number) => {
        if (!user) return;

        const duration = actualDuration !== undefined ? actualDuration : program.totalTime;
        const status = actualDuration !== undefined && actualDuration < program.totalTime ? 'incomplete' : 'completed';

        await addDoc(collection(db, 'users', user.uid, 'history'), {
            programName: program.name,
            duration: duration,
            targetDuration: program.totalTime,
            completedAt: Timestamp.now(),
            userId: user.uid,
            userName: user.displayName || user.email || 'Anônimo',
            userPhoto: user.photoURL || undefined,
            status
        });
    };

    const deleteProgram = async (id: string) => {
        if (!user) return;

        // First, unpublish from community if it exists there
        try {
            const globalQuery = query(
                collection(db, 'global_workouts'),
                where('originalId', '==', id),
                where('creatorId', '==', user.uid)
            );
            const globalSnap = await getDocs(globalQuery);

            // Delete from global if found
            for (const docSnap of globalSnap.docs) {
                await deleteDoc(docSnap.ref);
            }
        } catch (error) {
            console.error("Error unpublishing workout:", error);
        }

        // Then delete the local program
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

    const updateProgram = async (id: string, program: Partial<Program>) => {
        if (!user) return;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _, ...data } = program; // Ensure ID is not in data
        await setDoc(doc(db, 'users', user.uid, 'programs', id), {
            ...data,
            updatedAt: Timestamp.now()
        }, { merge: true });
    };

    const publishProgram = async (program: Program) => {
        if (!user) return;
        try {
            // Check if already published
            const q = query(
                collection(db, 'global_workouts'),
                where('originalId', '==', program.id),
                where('creatorId', '==', user.uid)
            );
            const querySnapshot = await getDocs(q);

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...programData } = program;

            if (!querySnapshot.empty) {
                // Update existing
                const existingDoc = querySnapshot.docs[0];
                await setDoc(doc(db, 'global_workouts', existingDoc.id), {
                    ...programData,
                    originalId: program.id,
                    creatorName: user.displayName || user.email?.split('@')[0] || 'Anônimo',
                    creatorId: user.uid,
                    publishedAt: Timestamp.now(), // Update timestamp to bump to top
                    isGlobal: true
                }, { merge: true });
                console.log("Program updated successfully");
            } else {
                // Create new
                await addDoc(collection(db, 'global_workouts'), {
                    ...programData,
                    originalId: program.id,
                    creatorName: user.displayName || user.email?.split('@')[0] || 'Anônimo',
                    creatorId: user.uid,
                    publishedAt: Timestamp.now(),
                    downloads: 0,
                    isGlobal: true
                });
                console.log("Program published successfully");
            }
        } catch (error) {
            console.error("Error publishing program:", error);
            alert("Erro ao publicar treino. Verifique o console para mais detalhes.");
            throw error;
        }
    };

    const unpublishProgram = async (programId: string) => {
        if (!user) return;
        try {
            const q = query(
                collection(db, 'global_workouts'),
                where('originalId', '==', programId),
                where('creatorId', '==', user.uid)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docToDelete = querySnapshot.docs[0];
                await deleteDoc(doc(db, 'global_workouts', docToDelete.id));
                console.log("Program unpublished successfully");
            }
        } catch (error) {
            console.error("Error unpublishing program:", error);
            throw error;
        }
    };

    const downloadProgram = async (program: Program) => {
        if (!user) return;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...programData } = program;
        await addDoc(collection(db, 'users', user.uid, 'programs'), {
            ...programData,
            name: `${program.name} (Baixado)`,
            isGlobal: false,
            downloadedFrom: program.id,
            createdAt: Timestamp.now(),
            userId: user.uid
        });
    };

    const [globalPrograms, setGlobalPrograms] = useState<Program[]>([]);

    useEffect(() => {
        const q = query(collection(db, 'global_workouts'), orderBy('publishedAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            const progs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Program));
            setGlobalPrograms(progs);
        }, (error) => {
            console.error("Error fetching global programs:", error);
        });
        return () => unsub();
    }, []);

    return (
        <DataContext.Provider value={{ customPrograms, history, globalHistory, streak, saveHistory, deleteProgram, saveProgram, updateProgram, globalPrograms, publishProgram, unpublishProgram, downloadProgram }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
