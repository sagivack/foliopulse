'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type Transaction = {
    id: number;
    type: 'BUY' | 'SELL';
    symbol: string;
    quantity: number;
    price: number;
    createdAt: string;
};

type Profile = {
    type: string;
    riskTolerance: string;
    horizon: string;
    score: number;
};

type Question = {
    id: number;
    text: string;
    order: number;
};

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Questionnaire state
    const [showQuestionnaire, setShowQuestionnaire] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchProfileData = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const [profileRes, historyRes] = await Promise.all([
                fetch('https://foliopulse.onrender.com/api/profiles/me', { headers }),
                fetch('https://foliopulse.onrender.com/api/portfolio/history', { headers })
            ]);

            if (profileRes.ok) {
                const profileData = await profileRes.json();
                // Si pas de profil, l'API peut renvoyer vide ou null
                setProfile(profileData && profileData.id ? profileData : null);
            }

            if (historyRes.ok) {
                const historyData = await historyRes.json();
                setTransactions(historyData);
            }
        } catch (err) {
            console.error("Erreur de chargement du profil", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    const openQuestionnaire = async () => {
        setShowQuestionnaire(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('https://foliopulse.onrender.com/api/profiles/questions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setQuestions(data);
                // Initialize answers with 3 (Neutral)
                const initialAnswers: Record<number, number> = {};
                data.forEach((q: Question) => initialAnswers[q.id] = 3);
                setAnswers(initialAnswers);
            }
        } catch (e) {
            console.error("Erreur de chargement des questions", e);
        }
    };

    const submitQuestionnaire = async () => {
        setIsSubmitting(true);
        const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
            questionId: parseInt(qId),
            value: val
        }));

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('https://foliopulse.onrender.com/api/profiles/questionnaire', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ answers: formattedAnswers })
            });

            if (res.ok) {
                setShowQuestionnaire(false);
                fetchProfileData(); // Reload profile
            } else {
                alert("Erreur lors de l'envoi du questionnaire.");
            }
        } catch (e) {
            console.error("Submit error", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex h-screen bg-[#070b14] text-white font-sans overflow-hidden">
            
            {/* Sidebar (Navigation Latérale) */}
            <aside className="w-64 border-r border-white/10 flex flex-col justify-between shrink-0 bg-white/[0.01]">
                <div className="p-6 space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-white/10 shrink-0">
                            <img src="/logo.png" alt="FolioPulse logo" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">FolioPulse</span>
                    </div>

                    <nav className="space-y-3">
                        <Link href="/dashboard" className="w-full flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl font-medium transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            Tableau de bord
                        </Link>
                        <Link href="/portfolio" className="w-full flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl font-medium transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Portefeuille
                        </Link>
                        <Link href="/analytics" className="w-full flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl font-medium transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Analytiques IA
                        </Link>
                    </nav>
                </div>
            </aside>

            {/* Zone Principale */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto relative">
                
                {/* Modal Questionnaire */}
                {showQuestionnaire && (
                    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                        <div className="bg-[#0f1523] border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                            <h2 className="text-2xl font-bold mb-2">Évaluation de votre Profil</h2>
                            <p className="text-gray-400 mb-8">
                                Répondez sur une échelle de 1 à 5.<br/>
                                <span className="text-blue-400 font-medium">1 = Le plus faible / prudent / court terme</span><br/>
                                <span className="text-red-400 font-medium">5 = Le plus élevé / agressif / long terme</span>
                            </p>
                            
                            {questions.length === 0 ? (
                                <p className="text-gray-500">Chargement des questions...</p>
                            ) : (
                                <div className="space-y-8">
                                    {questions.map((q) => (
                                        <div key={q.id} className="space-y-3">
                                            <p className="text-white font-medium">{q.order}. {q.text}</p>
                                            <div className="flex gap-2 justify-between">
                                                {[1, 2, 3, 4, 5].map((val) => (
                                                    <button
                                                        key={val}
                                                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: val }))}
                                                        className={`flex-1 py-2 rounded-lg font-bold border transition-colors ${
                                                            answers[q.id] === val 
                                                            ? 'bg-blue-600 border-blue-500 text-white' 
                                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                                        }`}
                                                    >
                                                        {val}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
                                        <button 
                                            onClick={() => setShowQuestionnaire(false)}
                                            className="px-6 py-2 rounded-xl text-gray-400 hover:text-white"
                                        >
                                            Annuler
                                        </button>
                                        <button 
                                            onClick={submitQuestionnaire}
                                            disabled={isSubmitting}
                                            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Enregistrement...' : 'Enregistrer mon Profil'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}


                <main className="p-8 max-w-[1200px] mx-auto w-full space-y-12 relative z-10">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Mon Profil Investisseur</h1>
                        <p className="text-gray-400">Gérez votre tolérance au risque et consultez votre historique.</p>
                    </div>

                    {isLoading ? (
                        <p className="text-gray-400">Chargement de votre profil...</p>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* Colonne Profil */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="glass-panel p-6 rounded-2xl border-t-2 border-t-blue-500/50 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-12 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                                    <h3 className="text-lg font-bold text-white mb-6 relative z-10">Paramètres IA</h3>
                                    
                                    {profile ? (
                                        <div className="space-y-4 relative z-10">
                                            <div>
                                                <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">Type</p>
                                                <p className="text-xl font-bold text-blue-400">{profile.type}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">Tolérance au risque</p>
                                                <p className="text-white font-medium">{profile.riskTolerance}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">Horizon</p>
                                                <p className="text-white font-medium">{profile.horizon}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">Score d'évaluation</p>
                                                <p className="text-white font-medium">{profile.score} / 100</p>
                                            </div>

                                            <button 
                                                onClick={openQuestionnaire}
                                                className="w-full mt-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-sm text-gray-300 transition-colors"
                                            >
                                                Refaire le Questionnaire
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 relative z-10">
                                            <p className="text-gray-400 text-sm leading-relaxed">Aucun profil configuré. L'IA a besoin de connaître votre tolérance au risque pour personnaliser ses conseils.</p>
                                            <button 
                                                onClick={openQuestionnaire}
                                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm text-white transition-colors shadow-lg shadow-blue-500/20"
                                            >
                                                Configurer mon Profil
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Colonne Historique */}
                            <div className="lg:col-span-2">
                                <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
                                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                        <h3 className="text-lg font-bold text-white">Historique des Transactions</h3>
                                        <span className="text-sm font-medium text-gray-500">{transactions.length} ordres</span>
                                    </div>
                                    
                                    {transactions.length === 0 ? (
                                        <div className="p-12 text-center flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-gray-600">
                                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <p className="text-gray-400 font-medium text-lg">Aucune transaction effectuée.</p>
                                            <p className="text-gray-500 text-sm mt-1">Vos futurs achats et ventes apparaîtront ici.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-white/[0.02] border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                                        <th className="font-semibold p-4 pl-6">Date</th>
                                                        <th className="font-semibold p-4">Type</th>
                                                        <th className="font-semibold p-4">Actif</th>
                                                        <th className="font-semibold p-4 text-right">Quantité</th>
                                                        <th className="font-semibold p-4 pr-6 text-right">Prix (Total)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {transactions.map((t) => (
                                                        <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                                                            <td className="p-4 pl-6 text-sm text-gray-400 whitespace-nowrap">
                                                                {new Date(t.createdAt).toLocaleString('fr-FR')}
                                                            </td>
                                                            <td className="p-4">
                                                                <span className={`px-2 py-1 rounded text-xs font-bold tracking-wide ${t.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                                    {t.type === 'BUY' ? 'ACHAT' : 'VENTE'}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 font-bold text-white text-lg">{t.symbol}</td>
                                                            <td className="p-4 text-right text-gray-300 font-medium">{t.quantity.toFixed(2)}</td>
                                                            <td className="p-4 pr-6 text-right font-medium text-white">
                                                                ${(t.price * t.quantity).toFixed(2)}
                                                                <div className="text-xs text-gray-500 mt-0.5">${t.price.toFixed(2)}/u</div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
