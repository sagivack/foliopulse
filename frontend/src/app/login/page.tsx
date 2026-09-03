'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch('https://foliopulse.onrender.com/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                // Sauvegarde du JWT
                localStorage.setItem('token', data.accessToken);
                window.location.href = '/dashboard';
            } else {
                setError(data.message || "Identifiants incorrects");
            }
        } catch(err) {
            setError("Serveur injoignable");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center p-4 relative min-h-screen">
            {/* Dynamic Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-background">
                <div className="absolute -top-1/2 -left-1/4 w-[1000px] h-[1000px] bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute -bottom-1/2 -right-1/4 w-[1000px] h-[1000px] bg-indigo-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="glass-panel w-full max-w-md p-8 space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-white">Bienvenue</h2>
                    <p className="mt-2 text-sm text-gray-400">Connectez-vous pour accéder à votre espace</p>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl text-center">
                        {error}
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none placeholder:text-gray-500"
                                placeholder="vous@exemple.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Mot de passe</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none placeholder:text-gray-500"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 px-4 bg-primary text-white rounded-xl font-medium shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all hover:-translate-y-0.5 disabled:opacity-50"
                    >
                        {isLoading ? "Connexion..." : "Se connecter"}
                    </button>
                </form>

                <div className="text-center text-sm text-gray-400">
                    Pas encore de compte ?{' '}
                    <Link href="/register" className="font-medium text-primary hover:text-blue-400 transition-colors">
                        Inscrivez-vous ici
                    </Link>
                </div>
            </div>
        </div>
    );
}
