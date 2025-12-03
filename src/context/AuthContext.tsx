import { createContext, useContext, useEffect, useState } from 'react';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Handle redirect result for mobile devices
        getRedirectResult(auth)
            .then((result) => {
                if (result) {
                    // User successfully signed in via redirect
                    console.log("Redirect sign-in successful", result.user);
                }
            })
            .catch((error) => {
                console.error("Error getting redirect result", error);
                alert(`Erro ao fazer login: ${error.message}`);
            });

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isMobile) {
                // On mobile, try popup first (works better on Chrome Android)
                // If popup fails, redirect will be used automatically by some browsers
                try {
                    await signInWithPopup(auth, provider);
                } catch (popupError: any) {
                    // If popup is blocked or fails, try redirect as fallback
                    if (popupError.code === 'auth/popup-blocked' ||
                        popupError.code === 'auth/popup-closed-by-user' ||
                        popupError.code === 'auth/cancelled-popup-request') {
                        console.log("Popup failed, trying redirect...");
                        await signInWithRedirect(auth, provider);
                    } else {
                        throw popupError;
                    }
                }
            } else {
                await signInWithPopup(auth, provider);
            }
        } catch (error) {
            console.error("Error signing in with Google", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
