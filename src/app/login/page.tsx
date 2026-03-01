"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate auth & redirect
        router.push("/dashboard");
    };

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-primary)] opacity-20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[var(--color-secondary)] opacity-10 blur-[100px] rounded-full"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo / Brand Area */}
                <div className="text-center mb-10">
                    <div className="inline-block p-4 rounded-2xl glass-effect mb-4 glow-accent">
                        <svg
                            className="w-10 h-10 text-[var(--color-primary)]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">DO Academy</h1>
                    <p className="text-slate-400 font-medium tracking-wide">Acceso al portal premium</p>
                </div>

                {/* Auth Card */}
                <div className="glass-effect rounded-2xl p-8 shadow-2xl">
                    {/* Tabs */}
                    <div className="flex border-b border-[var(--color-glass-border)] mb-8">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 pb-4 text-center font-semibold transition-all duration-300 ${isLogin
                                ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]"
                                : "text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            Iniciar Sesión
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 pb-4 text-center font-semibold transition-all duration-300 ${!isLogin
                                ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]"
                                : "text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            Registro
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Nombre completo
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-[rgba(0,0,0,0.3)] border border-[var(--color-glass-border)] rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                                    placeholder="Tu nombre"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                required
                                className="w-full bg-[rgba(0,0,0,0.3)] border border-[var(--color-glass-border)] rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                                placeholder="correo@ejemplo.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                required
                                className="w-full bg-[rgba(0,0,0,0.3)] border border-[var(--color-glass-border)] rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-[var(--color-primary)] hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 glow-accent mt-4"
                        >
                            {isLogin ? "Entrar al Portal" : "Crear Cuenta"}
                        </button>
                    </form>

                    {/* Teacher Portal Link for testing */}
                    <div className="mt-8 pt-6 border-t border-[var(--color-glass-border)] text-center">
                        <Link
                            href="/admin"
                            className="text-xs text-slate-500 hover:text-[var(--color-primary)] transition-colors inline-flex items-center gap-1"
                        >
                            Acceso a Portal Profesor / Admin
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
