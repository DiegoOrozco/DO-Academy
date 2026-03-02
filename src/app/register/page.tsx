import Link from "next/link";
import { UserPlus, ArrowLeft, Mail, Key, User } from "lucide-react";
import { registerStudent } from "@/actions/auth";

export default async function StudentRegisterPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[50%] h-[100%] bg-[var(--color-primary)] opacity-[0.15] blur-[150px] rounded-full"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft size={16} /> Volver al catálogo
                </Link>

                <div className="text-center mb-8">
                    <div className="inline-block p-4 rounded-2xl glass-effect mb-4 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                        <UserPlus className="w-10 h-10 text-[var(--color-secondary)] shadow-accent" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Crear Cuenta</h1>
                    <p className="text-slate-400 font-medium tracking-wide">Únete a la mejor academia de automatización.</p>
                </div>

                <div className="glass-effect rounded-2xl p-8 shadow-2xl border border-[var(--color-glass-border)]">
                    {error === "exists" && (
                        <div className="mb-4 bg-red-500/20 text-red-500 text-sm p-3 rounded-lg border border-red-500/30 text-center font-medium">
                            Este correo ya está registrado o hubo un error.
                        </div>
                    )}
                    {error === "missing" && (
                        <div className="mb-4 bg-red-500/20 text-red-500 text-sm p-3 rounded-lg border border-red-500/30 text-center font-medium">
                            Por favor completa todos los campos.
                        </div>
                    )}

                    <form action={registerStudent} className="space-y-5">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">
                                Nombre Completo
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="w-full bg-[rgba(0,0,0,0.3)] border border-[var(--color-glass-border)] rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                                    placeholder="Julio Perez"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    className="w-full bg-[rgba(0,0,0,0.3)] border border-[var(--color-glass-border)] rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                                    placeholder="tunombre@ejemplo.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    className="w-full bg-[rgba(0,0,0,0.3)] border border-[var(--color-glass-border)] rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-[var(--color-secondary)] hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 glow-accent mt-4 flex items-center justify-center gap-2"
                        >
                            Comenzar Ahora
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-400">
                            ¿Ya tienes cuenta?{" "}
                            <Link href="/login" className="text-[var(--color-primary)] font-semibold hover:underline">
                                Inicia sesión aquí
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
