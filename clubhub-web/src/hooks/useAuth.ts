import { useState, useEffect } from 'react';
import firebase from '@/model/firebase';

export interface AuthState {
    user: firebase.User | null;
    uid: string | null;
    loading: boolean;
}

export function useAuth(): AuthState {
    const [user, setUser] = useState<firebase.User | null>(null);
    const [uid, setUid] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = firebase.auth();
        const unsubscribe = auth.onAuthStateChanged((authUser) => {
            setUser(authUser);
            setUid(authUser ? authUser.uid : null);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return { user, uid, loading };
}
