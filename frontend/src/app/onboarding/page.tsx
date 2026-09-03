'use client';
import { useState } from 'react';
import Link from 'next/link';

// Mock questions with real answer options for the UI presentation
const QUESTIONS = [
    {
        id: 1,
        text: "Quel est votre objectif principal en investissant ?",
        options: [
            { text: "Préserver mon capital à tout prix", value: 1 },
            { text: "Obtenir des revenus réguliers", value: 2 },
            { text: "Faire croître lentement mais sûrement", value: 3 },
            { text: "Maximiser la croissance (gains importants)", value: 4 },
            { text: "Spéculer agressivement", value: 5 },
        ]
    },
    {
        id: 2,
        text: "Comment réagiriez-vous si votre portefeuille perdait 20% en un mois ?",
        options: [
            { text: "Je vends tout immédiatement (panique)", value: 1 },
            { text: "Je vends une partie pour limiter la casse", value: 2 },
            { text: "Je ne fais rien et j'attends", value: 3 },
            { text: "J'achète encore plus (opportunité en or)", value: 5 },
        ]
    },
    {
        id: 3,
        text: "Dans combien de temps comptez-vous retirer vos fonds ?",
        options: [
            { text: "Moins de 1 an", value: 1 },
            { text: "De 1 à 3 ans", value: 2 },
            { text: "De 3 à 7 ans", value: 3 },
            { text: "Plus de 7 ans", value: 5 },
        ]
    }
];

export default function OnboardingPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [completed, setCompleted] = useState(false);

    const handleSelect = (val: number) => {
        setAnswers(prev => ({ ...prev, [QUESTIONS[currentStep].id]: val }));
        if (currentStep < QUESTIONS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setCompleted(true);
        }
    };

    if (completed) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] pointer-events-none -z-10" />
                <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-4xl font-bold text-white">Profil Calculé !</h2>
                <p className="text-xl text-gray-400 max-w-md">
                    Notre IA a déterminé que vous avez un profil <strong className="text-emerald-400">Croissance Modérée</strong>.
                </p>
                <Link href="/dashboard" className="px-8 py-4 mt-8 bg-primary text-white rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:-translate-y-1 transition-all inline-block font-medium">
                    Accéder à mon tableau de bord
                </Link>
            </div>
        );
    }

    const question = QUESTIONS[currentStep];

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
            <div className="w-full max-w-2xl glass-panel p-8 md:p-12">
                <div className="mb-8">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>Question {currentStep + 1} sur {QUESTIONS.length}</span>
                        <span>{Math.round(((currentStep) / QUESTIONS.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-500"
                            style={{ width: `${((currentStep) / QUESTIONS.length) * 100}%` }}
                        />
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-8 leading-tight">
                    {question.text}
                </h2>

                <div className="space-y-4">
                    {question.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSelect(option.value)}
                            className="w-full p-4 text-left rounded-xl border border-white/10 bg-white/5 hover:bg-primary/20 hover:border-primary/50 transition-all text-white flex justify-between group"
                        >
                            <span>{option.text}</span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">→</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
