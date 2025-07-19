'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/model/firebase';
import { onAuthStateChanged, User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useRouter } from 'next/navigation';

type AuthMode = 'login' | 'register' | 'reset';

export default function AuthPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [mode, setMode] = useState<AuthMode>('login');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setAuthUser(user);
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!authLoading && authUser) {
            router.push('/');
        }
    }, [authUser, authLoading, router]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); 
        setMessage('');
        setLoading(true);

        try {
            if (mode === 'register') {
                if (password !== confirmPassword) {
                    setError('Passwords do not match');
                    setLoading(false);
                    return;
                }
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const newUser = userCredential.user;
                if (newUser) {
                    // Wait for the user to be authenticated
                    const idToken = await newUser.getIdToken();
                    
                    const a = await fetch('/api/users', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json' ,
                            'Authorization': `Bearer ${idToken}`
                        },
                        body: JSON.stringify({
                            id: newUser.uid,
                            name: '',
                            email: newUser.email || '',
                            campus: '',
                            bio: '',
                            followed_clubs: [],
                            liked_posts: [],
                            is_admin: false,
                            is_executive: false,
                            managed_clubs: []
                        }),
                    });
                    console.log('User created in Firestore:', await a.json());
                    setMessage('Account created successfully! Redirecting...');
                    setTimeout(() => router.push('/'), 3000);
                }
            } else if (mode === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
                console.log('Token:', await auth.currentUser?.getIdToken());
                router.push('/');
            } else if (mode === 'reset') {
                await sendPasswordResetEmail(auth, email);
                setMessage('Password reset email sent! Check your inbox.');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return <div className="flex justify-center items-center min-h-screen text-foreground">Loading...</div>;
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-background">
            <div className="w-full max-w-md p-8 rounded-lg bg-card text-card-foreground border border-border">
                <h1 className="text-2xl font-bold mb-6 text-center">
                    {mode === 'login' ? 'Log In' : mode === 'register' ? 'Create Account' : 'Reset Password'}
                </h1>
                
                {error && (
                    <div role="alert" className="bg-destructive text-destructive-foreground p-3 mb-4 rounded">
                        <span>{error}</span>
                    </div>
                )}
                
                {message && (
                    <div role="alert" className="bg-success text-white p-3 mb-4 rounded">
                        <span>{message}</span>
                    </div>
                )}
                
                <form onSubmit={handleAuth}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-2 rounded bg-input text-foreground border border-border focus:border-ring focus:ring focus:ring-ring focus:outline-none"
                        />
                    </div>
                    
                    {mode !== 'reset' && (
                        <div className="mb-4">
                            <label htmlFor="password" className="block mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full p-2 rounded bg-input text-foreground border border-border focus:border-ring focus:ring focus:ring-ring focus:outline-none"
                            />
                        </div>
                    )}
                    
                    {mode === 'register' && (
                        <div className="mb-6">
                            <label htmlFor="confirmPassword" className="block mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full p-2 rounded bg-input text-foreground border border-border focus:border-ring focus:ring focus:ring-ring focus:outline-none"
                            />
                        </div>
                    )}
                    
                    <div className="mb-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full p-2 bg-primary hover:bg-primary/80 active:bg-primary/90 text-primary-foreground rounded font-medium"
                        >
                            {loading ? 'Processing...' : mode === 'login' ? 'Log In' : mode === 'register' ? 'Create Account' : 'Send Reset Email'}
                        </button>
                    </div>
                </form>
                
                <div className="text-center">
                    {mode === 'login' && (
                        <>
                            <p className="mb-2">
                                Don't have an account?{' '}
                                <button 
                                    onClick={() => setMode('register')}
                                    className="text-primary hover:text-primary/80 focus:text-primary/90"
                                >
                                    Sign up
                                </button>
                            </p>
                            <p>
                                <button 
                                    onClick={() => setMode('reset')}
                                    className="text-primary hover:text-primary/80 focus:text-primary/90"
                                >
                                    Forgot password?
                                </button>
                            </p>
                        </>
                    )}
                    
                    {mode === 'register' && (
                        <p>
                            Already have an account?{' '}
                            <button 
                                onClick={() => setMode('login')}
                                className="text-primary hover:text-primary/80 focus:text-primary/90"
                            >
                                Log in
                            </button>
                        </p>
                    )}
                    
                    {mode === 'reset' && (
                        <p>
                            <button 
                                onClick={() => setMode('login')}
                                className="text-primary hover:text-primary/80 focus:text-primary/90"
                            >
                                Back to login
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
