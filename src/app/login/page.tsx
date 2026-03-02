import Link from "next/link";
import { Lock, ArrowLeft, Mail, Key } from "lucide-react";
import { loginStudent } from "@/actions/auth";
import { getStudent } from "@/lib/student-auth";
import { redirect } from "next/navigation";

export default async function StudentLoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;

    const student = await getStudent();
    if (student) {
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
                        <Lock className="w-10 h-10 text-[var(--color-primary)] shadow-accent" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Ingreso Estudiantes</h1>
                    <p className="text-slate-400 font-medium tracking-wide">Accede a tus cursos y progreso.</p>
                </div>

                <div className="glass-effect rounded-2xl p-8 shadow-2xl border border-[var(--color-glass-border)]">
                    {error === "incorrect" && (
                        <div className="mb-4 bg-red-500/20 text-red-500 text-sm p-3 rounded-lg border border-red-500/30 text-center font-medium">
                            Credenciales incorrectas. Inténtalo de nuevo.
                        </div>
                    )}

                    <form action={loginStudent} className="space-y-5">
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
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-[var(--color-primary)] hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 glow-accent mt-4 flex items-center justify-center gap-2"
                        >
                            Iniciar Sesión
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-400">
                            ¿No tienes cuenta?{" "}
                            <Link href="/register" className="text-[var(--color-primary)] font-semibold hover:underline">
                                Regístrate aquí
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
