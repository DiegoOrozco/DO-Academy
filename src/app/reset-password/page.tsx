import Link from "next/link";
import { ArrowLeft, Key, AlertCircle } from "lucide-react";
import { resetPassword } from "@/actions/password-reset";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function ResetPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string; error?: string }>;
}) {
    const { token, error } = await searchParams;

    if (!token) {
        redirect("/forgot-password?error=missing");
    }

    // Validate token server-side before showing form
    const user = await prisma.user.findUnique({
        where: { resetToken: token },
        select: { id: true, resetTokenExpiry: true, name: true },
    });

    const isValid = user && user.resetTokenExpiry && user.resetTokenExpiry > new Date();

    if (!isValid) {
        redirect("/forgot-password?error=expired");
    }

    const resetWithToken = resetPassword.bind(null);

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-4 pt-32 pb-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[50%] h-[100%] bg-[var(--color-primary)] opacity-[0.15] blur-[150px] rounded-full"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft size={16} /> Volver al inicio de sesión
                </Link>

                <div className="text-center mb-8">
                    <div className="inline-block p-4 rounded-2xl glass-effect mb-4 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                        <Key className="w-10 h-10 text-[var(--color-primary)] drop-shadow-md" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2">Nueva Contraseña</h1>
                    <p className="text-slate-400 font-medium">
                        Hola <span className="text-white font-bold">{user.name.split(" ")[0]}</span>, elige una contraseña segura.
                    </p>
                </div>

                <div className="glass-effect rounded-2xl p-8 shadow-2xl border border-[var(--color-glass-border)]">
                    {error === "mismatch" && (
                        <div className="mb-4 bg-red-500/10 text-red-400 text-sm p-3 rounded-xl border border-red-500/20 flex items-center gap-2">
                            <AlertCircle size={14} /> Las contraseñas no coinciden. Inténtalo de nuevo.
                        </div>
                    )}
                    {error === "short" && (
                        <div className="mb-4 bg-red-500/10 text-red-400 text-sm p-3 rounded-xl border border-red-500/20 flex items-center gap-2">
                            <AlertCircle size={14} /> La contraseña debe tener al menos 6 caracteres.
                        </div>
                    )}
                    {error === "missing" && (
                        <div className="mb-4 bg-red-500/10 text-red-400 text-sm p-3 rounded-xl border border-red-500/20 flex items-center gap-2">
                            <AlertCircle size={14} /> Por favor completa todos los campos.
                        </div>
                    )}

                    <form action={resetWithToken} className="space-y-5">
                        <input type="hidden" name="token" value={token} />

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-300">Nueva Contraseña</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                    className="w-full bg-[rgba(0,0,0,0.3)] border border-[var(--color-glass-border)] rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-300">Confirmar Contraseña</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    name="confirm"
                                    required
                                    autoComplete="new-password"
                                    className="w-full bg-[rgba(0,0,0,0.3)] border border-[var(--color-glass-border)] rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                                    placeholder="Repite tu contraseña"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-[var(--color-primary)] hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30"
                        >
                            Actualizar Contraseña
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
