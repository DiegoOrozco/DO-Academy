import Link from "next/link";
import { ArrowLeft, Mail, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { requestPasswordReset } from "@/actions/password-reset";

export default async function ForgotPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ sent?: string; error?: string }>;
}) {
    const { sent, error } = await searchParams;

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
                        <Mail className="w-10 h-10 text-[var(--color-primary)] drop-shadow-md" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2">Recuperar Contraseña</h1>
                    <p className="text-slate-400 font-medium">Te enviaremos un enlace para restablecer tu contraseña.</p>
                </div>

                <div className="glass-effect rounded-2xl p-8 shadow-2xl border border-[var(--color-glass-border)]">
                    {sent === "true" ? (
                        <div className="text-center py-6 space-y-6">
                            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                                <CheckCircle size={40} className="text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white mb-3">¡Email enviado!</h2>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Si ese correo tiene una cuenta activa, recibirás un enlace de recuperación en los próximos minutos. Revisa también tu carpeta de spam.
                                </p>
                            </div>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-[var(--color-primary)] font-bold text-sm hover:underline"
                            >
                                Volver al login <ArrowRight size={14} />
                            </Link>
                        </div>
                    ) : (
                        <>
                            {error === "missing" && (
                                <div className="mb-4 bg-red-500/10 text-red-400 text-sm p-3 rounded-xl border border-red-500/20 flex items-center gap-2">
                                    <AlertCircle size={14} /> Por favor ingresa tu correo electrónico.
                                </div>
                            )}
                            {error === "expired" && (
                                <div className="mb-4 bg-orange-500/10 text-orange-400 text-sm p-3 rounded-xl border border-orange-500/20 flex items-center gap-2">
                                    <AlertCircle size={14} /> El enlace expiró. Solicita uno nuevo.
                                </div>
                            )}

                            <form action={requestPasswordReset} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-300">
                                        Correo Electrónico
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            autoComplete="email"
                                            className="w-full bg-[rgba(0,0,0,0.3)] border border-[var(--color-glass-border)] rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                                            placeholder="tunombre@ejemplo.com"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-[var(--color-primary)] hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    Enviar enlace de recuperación
                                    <ArrowRight size={16} />
                                </button>
                            </form>

                            <p className="text-center text-xs text-slate-500 mt-6">
                                ¿Recuerdas tu contraseña?{" "}
                                <Link href="/login" className="text-[var(--color-primary)] font-bold hover:underline">
                                    Inicia sesión
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
