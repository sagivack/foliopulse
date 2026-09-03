'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch('https://foliopulse.onrender.com/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                // L'utilisateur est créé, on le redirige vers le login
                window.location.href = '/login';
            } else {
                setError(data.message || "Erreur lors de l'inscription");
            }
        } catch(err) {
            setError("Serveur injoignable");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center p-4 relative min-h-screen">
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-[#070b14]">
                <div className="absolute -top-1/2 -left-1/4 w-[1000px] h-[1000px] bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="glass-panel w-full max-w-md p-8 space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-white">Inscription</h2>
                    <p className="mt-2 text-sm text-gray-400">Rejoignez FolioPulse dès aujourd'hui</p>
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
                                className="mt-1 block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder:text-gray-600"
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
                                className="mt-1 block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder:text-gray-600"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                        {isLoading ? "Création en cours..." : "Créer mon compte"}
                    </button>
                </form>

                <div className="text-center text-sm text-gray-400">
                    Déjà un compte ?{' '}
                    <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300">
                        Connectez-vous
                    </Link>
                </div>
            </div>
        </div>
    );
}
