'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/model/firebase';
import { onAuthStateChanged, User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

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
    const { theme } = useTheme();

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
            provider.setCustomParameters({
                prompt: 'select_account'
            });
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
    }   
    
  return (
    <div className="min-h-screen relative overflow-hidden bg-theme-gradient" data-theme={theme}>
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-animated-elements">
        <div className="element-1"></div>
        <div className="element-2"></div>
        <div className="element-3"></div>
        <div className="element-4"></div>
        <div className="element-5"></div>
        <div className="element-6"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex justify-center items-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Frosted glass card */}
          <div className="theme-card">
            {/* Header with gradient text */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent mb-2">
                {mode === "login" ? "Welcome Back" : mode === "register" ? "Join Us" : "Reset Password"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {mode === "login"
                  ? "Sign in to your account"
                  : mode === "register"
                    ? "Create your account"
                    : "Enter your email to reset"}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="backdrop-blur-sm bg-destructive/20 border border-destructive/30 text-destructive-foreground p-3 mb-4 rounded-xl"
              >
                <span>{error}</span>
              </div>
            )}

            {/* Success message */}
            {message && (
              <div
                role="alert"
                className="backdrop-blur-sm bg-success/20 border border-success/30 text-foreground p-3 mb-4 rounded-xl"
              >
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-6">
              {/* Email field */}
              <div>
                <label htmlFor="email" className="block text-foreground text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl backdrop-blur-sm bg-input border border-border text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>

              {/* Password field */}
              {mode !== "reset" && (
                <div>
                  <label htmlFor="password" className="block text-foreground text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full p-3 rounded-xl backdrop-blur-sm bg-input border border-border text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                    placeholder="Enter your password"
                  />
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="theme-button w-full p-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : mode === "login" ? (
                  "Sign In"
                ) : mode === "register" ? (
                  "Create Account"
                ) : (
                  "Send Reset Email"
                )}
              </button>

              {/* Google sign-in button */}
              {mode === "login" && (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full p-3 backdrop-blur-sm bg-card/50 hover:bg-card/70 border border-border text-foreground rounded-xl font-medium flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_17_40)">
                      <path
                        d="M47.5 24.5C47.5 22.6 47.3 20.8 47 19H24V29H37.1C36.5 32.1 34.5 34.7 31.7 36.4V42H39.3C44 38.1 47.5 32 47.5 24.5Z"
                        fill="#4285F4"
                      />
                      <path
                        d="M24 48C30.6 48 36.1 45.9 39.3 42L31.7 36.4C29.9 37.6 27.7 38.3 24 38.3C18.7 38.3 14.1 34.7 12.5 29.9H4.7V35.7C8.1 42.1 15.4 48 24 48Z"
                        fill="#34A853"
                      />
                      <path
                        d="M12.5 29.9C12.1 28.7 11.9 27.4 11.9 26C11.9 24.6 12.1 23.3 12.5 22.1V16.3H4.7C3.1 19.3 2 22.5 2 26C2 29.5 3.1 32.7 4.7 35.7L12.5 29.9Z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M24 9.7C27.2 9.7 29.7 10.8 31.5 12.5L39.4 5.1C36.1 2.1 30.6 0 24 0C15.4 0 8.1 5.9 4.7 12.3L12.5 18.1C14.1 13.3 18.7 9.7 24 9.7Z"
                        fill="#EA4335"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_17_40">
                        <rect width="48" height="48" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                  Continue with Google
                </button>
              )}
            </form>

            {/* Footer links */}
            <div className="text-center mt-8 space-y-3">
              {mode === "login" && (
                <>
                  <p className="text-muted-foreground text-sm">
                    {"Don't have an account? "}
                    <button
                      onClick={handleGoogleSignIn}
                      className="text-primary hover:text-primary/80 font-semibold transition-colors duration-200"
                    >
                      Sign up with Google
                    </button>
                  </p>
                  <p>
                    <button
                      onClick={() => setMode("reset")}
                      className="text-secondary hover:text-secondary/80 text-sm transition-colors duration-200"
                    >
                      Forgot your password?
                    </button>
                  </p>
                </>
              )}
              {mode === "reset" && (
                <p>
                  <button
                    onClick={() => setMode("login")}
                    className="text-primary hover:text-primary/80 text-sm transition-colors duration-200"
                  >
                    ← Back to sign in
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary/20 rounded-full blur-sm"></div>
          <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-accent/20 rounded-full blur-sm"></div>
        </div>
      </div>
    </div>
  )
}
