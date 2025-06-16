'use client';

import { useState, useEffect } from 'react';
import firebase from '@/model/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

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
    const auth = firebase.auth();
    const { user: authUser, loading: authLoading } = useAuth();

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
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
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
                await auth.signInWithEmailAndPassword(email, password);
                router.push('/');
            } else if (mode === 'reset') {
                await auth.sendPasswordResetEmail(email);
                setMessage('Password reset email sent! Check your inbox.');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return <div className="flex justify-center items-center min-h-screen text-gray-800">Loading...</div>; // Changed text-white to text-gray-800
    }

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="w-full max-w-md p-8 rounded-lg text-gray-800"> {/* Changed text-white to text-gray-800 */}
                <h1 className="text-2xl font-bold mb-6 text-center">
                    {mode === 'login' ? 'Log In' : mode === 'register' ? 'Create Account' : 'Reset Password'}
                </h1>
                
                {error && (
                    <div role="alert" className="bg-red-500 text-gray-100 p-3 mb-4 rounded"> {/* Changed text-white to text-gray-100 for better contrast on red */}
                        <span>{error}</span>
                    </div>
                )}
                
                {message && (
                    <div role="alert" className="bg-green-500 text-gray-100 p-3 mb-4 rounded"> {/* Changed text-white to text-gray-100 for better contrast on green */}
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
                            className="w-full p-2 rounded text-gray-800 bg-white border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:outline-none" /* Changed text-white to text-gray-800, added bg-white, adjusted border */
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
                                className="w-full p-2 rounded text-gray-800 bg-white border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:outline-none" /* Changed text-white to text-gray-800, added bg-white, adjusted border */
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
                                className="w-full p-2 rounded text-gray-800 bg-white border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:outline-none" /* Changed text-white to text-gray-800, added bg-white, adjusted border */
                            />
                        </div>
                    )}
                    
                    <div className="mb-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full p-2 bg-blue-600 hover:bg-blue-800 active:bg-blue-900 text-white rounded font-medium" /* Kept text-white for contrast on blue button */
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
                                    className="text-blue-400 hover:text-blue-300 focus:text-blue-500"
                                >
                                    Sign up
                                </button>
                            </p>
                            <p>
                                <button 
                                    onClick={() => setMode('reset')}
                                    className="text-blue-400 hover:text-blue-300 focus:text-blue-500"
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
                                className="text-blue-400 hover:text-blue-300 focus:text-blue-500"
                            >
                                Log in
                            </button>
                        </p>
                    )}
                    
                    {mode === 'reset' && (
                        <p>
                            <button 
                                onClick={() => setMode('login')}
                                className="text-blue-400 hover:text-blue-300 focus:text-blue-500"
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
