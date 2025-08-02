'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/model/firebase';
import { onAuthStateChanged, User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';

type AuthMode = 'login' | 'register' | 'reset';

export default function AuthPage() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
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
                setError('Account creation is only available via Google sign-in.');
                setLoading(false);
                return;
            } else if (mode === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
                console.log('Token:', await auth.currentUser?.getIdToken());
                router.push('/');
            } else if (mode === 'reset') {
                await sendPasswordResetEmail(auth, email);
                setMessage('Password reset email sent! Check your inbox.');
            }
        } catch (err: any) {
            setError('Login failed!');
        } finally {
            setLoading(false);
        }
    };

    // Add Google sign-in handler
    const handleGoogleSignIn = async () => {
        setError("");
        setMessage("");
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            if (user) {
                // Check if this is a new user by trying to fetch their profile
                const idToken = await user.getIdToken();
                const response = await fetch(`/api/users?id=${user.uid}`, {
                    headers: { 'Authorization': `Bearer ${idToken}` },
                });
                if (response.status === 404) {
                    // New user, create profile
                    const createResponse = await fetch('/api/users', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`
                        },
                        body: JSON.stringify({
                            id: user.uid,
                            name: user.displayName || '',
                            email: user.email || '',
                            campus: '',
                            bio: '',
                            followed_clubs: [],
                            liked_posts: [],
                            is_admin: false,
                            is_executive: false,
                            managed_clubs: []
                        }),
                    });
                    if (!createResponse.ok) {
                        const errorData = await createResponse.json();
                        setError(`Failed to create user profile: ${errorData.error}`);
                        setLoading(false);
                        return;
                    }
                }
                router.push('/');
            }
        } catch (err: any) {
            let msg = err.message || 'Google sign-in failed';
            if (err.code === 'auth/invalid-credential') {
                msg = 'Login failed, invalid credentials';
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return <div className="flex justify-center items-center min-h-screen text-foreground">Loading...</div>;
    }    return (
        <div className="flex justify-center items-center min-h-screen bg-background p-4">
            <div className="w-full max-w-md p-8 rounded-xl bg-card text-card-foreground border border-border shadow-lg mx-4">
                <h1 className="text-3xl font-bold mb-8 text-center text-primary">
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

                    <div className="mb-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full p-2 bg-primary hover:bg-primary/80 active:bg-primary/90 text-primary-foreground rounded font-medium"
                        >
                            {loading ? 'Processing...' : mode === 'login' ? 'Log In' : 'Send Reset Email'}
                        </button>
                    </div>
                    {mode === 'login' && (
                        <div className="mb-6">
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                className="w-full p-2 bg-card border border-border text-card-foreground rounded font-medium flex items-center justify-center gap-2 shadow hover:bg-muted transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_17_40)">
                                        <path d="M47.5 24.5C47.5 22.6 47.3 20.8 47 19H24V29H37.1C36.5 32.1 34.5 34.7 31.7 36.4V42H39.3C44 38.1 47.5 32 47.5 24.5Z" fill="#4285F4"/>
                                        <path d="M24 48C30.6 48 36.1 45.9 39.3 42L31.7 36.4C29.9 37.6 27.7 38.3 24 38.3C18.7 38.3 14.1 34.7 12.5 29.9H4.7V35.7C8.1 42.1 15.4 48 24 48Z" fill="#34A853"/>
                                        <path d="M12.5 29.9C12.1 28.7 11.9 27.4 11.9 26C11.9 24.6 12.1 23.3 12.5 22.1V16.3H4.7C3.1 19.3 2 22.5 2 26C2 29.5 3.1 32.7 4.7 35.7L12.5 29.9Z" fill="#FBBC05"/>
                                        <path d="M24 9.7C27.2 9.7 29.7 10.8 31.5 12.5L39.4 5.1C36.1 2.1 30.6 0 24 0C15.4 0 8.1 5.9 4.7 12.3L12.5 18.1C14.1 13.3 18.7 9.7 24 9.7Z" fill="#EA4335"/>
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_17_40">
                                            <rect width="48" height="48" fill="currentColor"/>
                                        </clipPath>
                                    </defs>
                                </svg>
                                Continue with Google
                            </button>
                        </div>
                    )}
                </form>
                <div className="text-center">
                    {mode === 'login' && (
                        <>
                            <p className="mb-2">
                                Don't have an account?{' '}
                                <span className="text-primary font-semibold cursor-pointer" onClick={handleGoogleSignIn}>Sign up with Google</span>
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
