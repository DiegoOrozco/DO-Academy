import Link from "next/link";
import { UserPlus, ArrowLeft, Mail, Key, User } from "lucide-react";
import { registerStudent } from "@/actions/auth";
import { getStudent } from "@/lib/student-auth";
import { redirect } from "next/navigation";

export default async function StudentRegisterPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; courseId?: string }>;
}) {
    const { error, courseId } = await searchParams;

    const student = await getStudent();
    if (student) {
        if (courseId) {
            redirect(`/course/${courseId}/unlock`);
        }
        redirect("/");
    }

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
                    <a
                        href="/api/auth/google"
                        className="w-full bg-white/5 hover:bg-white/10 text-white font-semibold py-3 px-4 rounded-lg border border-white/10 transition-all duration-300 flex items-center justify-center gap-3 mb-6 group"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Comenzar con Google
                    </a>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-widest">
                            <span className="bg-[#0f172a] px-2 text-slate-500 font-bold">o con correo</span>
                        </div>
                    </div>

                    {error === "google_linked" && (
                        <div className="mb-4 bg-orange-500/20 text-orange-400 text-sm p-4 rounded-lg border border-orange-500/30 text-center font-medium shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                            <p className="font-bold mb-1">Correo vinculado a Google</p>
                            <p className="opacity-80 text-xs">Ya tienes una cuenta activa usando Google Auth. Haz clic en "Comenzar con Google" para entrar.</p>
                        </div>
                    )}

                    {error === "exists" && (
                        <div className="mb-4 bg-red-500/20 text-red-500 text-sm p-3 rounded-lg border border-red-500/30 text-center font-medium">
                            Este correo ya está registrado. <Link href="/login" className="underline font-bold">Inicia sesión aquí</Link>
                        </div>
                    )}
                    {error === "missing" && (
                        <div className="mb-4 bg-red-500/20 text-red-500 text-sm p-3 rounded-lg border border-red-500/30 text-center font-medium">
                            Por favor completa todos los campos.
                        </div>
                    )}

                    <form action={registerStudent} className="space-y-5">
                        <input type="hidden" name="courseId" value={courseId || ""} />
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
