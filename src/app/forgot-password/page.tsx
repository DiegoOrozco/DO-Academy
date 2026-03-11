"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { requestPasswordReset, testEmailConfig, diagnosticSendTestEmail } from "@/actions/password-reset";
import { useSearchParams } from "next/navigation";

function ForgotPasswordContent() {
    const searchParams = useSearchParams();
    const debug = searchParams.get("debug");
    const forceExpired = searchParams.get("error") === "expired";

    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error_missing" | "error_send" | "error_fatal" | "error_google">("idle");

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            try {
                const result = await requestPasswordReset(formData);
                if (result.success) {
                    setStatus("success");
                } else {
                    if (result.error === "missing") setStatus("error_missing");
                    else if (result.error === "google_account") setStatus("error_google");
                    else if (result.error === "fallo-envio") setStatus("error_send");
                    else setStatus("error_fatal");
                }
            } catch (error) {
                console.error("Unhanlded client error:", error);
                setStatus("error_fatal");
            }
        });
    };

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
                    {status === "success" ? (
                        <div className="text-center py-6 space-y-6 animate-in fade-in zoom-in duration-500">
                            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                                <CheckCircle size={40} className="text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white mb-3">¡Email enviado!</h2>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Si ese correo tiene una cuenta activa, recibirás un enlace de recuperación pronto. Revisa tu carpeta de spam o promociones si no lo ves.
                                </p>
                            </div>
                            <button
                                onClick={() => setStatus("idle")}
                                className="inline-flex items-center gap-2 text-[var(--color-primary)] font-bold text-sm hover:underline"
                            >
                                <ArrowLeft size={14} /> Intentar con otro correo
                            </button>
                        </div>
                    ) : (
                        <>
                            {status === "error_missing" && (
                                <div className="mb-4 bg-orange-500/10 text-orange-400 text-sm p-3 rounded-xl border border-orange-500/20 flex items-center gap-2">
                                    <AlertCircle size={14} className="shrink-0" /> Por favor ingresa tu correo electrónico.
                                </div>
                            )}
                            {status === "error_send" && (
                                <div className="mb-4 bg-red-500/10 text-red-400 text-sm p-3 rounded-xl border border-red-500/20 flex items-center gap-2">
                                    <AlertCircle size={14} className="shrink-0" /> Hubo un problema enviando el correo. Activa el modo debug para analizar logs.
                                </div>
                            )}
                            {status === "error_fatal" && (
                                <div className="mb-4 bg-red-500/10 text-red-400 text-sm p-3 rounded-xl border border-red-500/20 flex items-center gap-2">
                                    <AlertCircle size={14} className="shrink-0" /> Error de conexión con el servidor. Intenta de nuevo más tarde.
                                </div>
                            )}
                            {status === "error_google" && (
                                <div className="mb-4 bg-blue-500/10 text-blue-400 text-sm p-3 rounded-xl border border-blue-500/20 flex items-start gap-2 text-left">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <div>
                                        <strong>Cuenta vinculada a Google.</strong><br />
                                        Por favor regresa al login y presiona el botón de &quot;Continuar con Google&quot; para iniciar sesión o recuperar tu acceso a través de ellos.
                                    </div>
                                </div>
                            )}
                            {forceExpired && status === "idle" && (
                                <div className="mb-4 bg-orange-500/10 text-orange-400 text-sm p-3 rounded-xl border border-orange-500/20 flex items-center gap-2">
                                    <AlertCircle size={14} className="shrink-0" /> El enlace expiró. Solicita uno nuevo.
                                </div>
                            )}

                            <form action={handleSubmit} className="space-y-5">
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
                                            disabled={isPending}
                                            className="w-full bg-[rgba(0,0,0,0.3)] border border-[var(--color-glass-border)] rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all disabled:opacity-50"
                                            placeholder="tunombre@ejemplo.com"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full bg-[var(--color-primary)] hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isPending ? (
                                        <>
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            Enviar enlace de recuperación
                                            <ArrowRight size={16} />
                                        </>
                                    )}
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

                {debug === "true" && (
                    <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl space-y-3">
                        <p className="text-yellow-500 text-xs font-bold uppercase mb-2 text-center">Herramienta de Diagnóstico</p>

                        <button
                            type="button"
                            onClick={async () => {
                                const res = await testEmailConfig();
                                alert("Verificación de Configuración Completada. Revisa los logs de Vercel.");
                            }}
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all"
                        >
                            1. Verificar Entorno (Solo Logs)
                        </button>

                        <button
                            type="button"
                            onClick={async () => {
                                alert("Enviando correo de prueba. Revisa la consola y tu bandeja de entrada.");
                                const res = await diagnosticSendTestEmail();
                                if (!res.success) alert("Error: " + res.error);
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all"
                        >
                            2. Enviar Email de Prueba (Full Flow)
                        </button>

                    </div>
                )}
            </div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white/20 border-t-[var(--color-primary)] rounded-full animate-spin"></div>
            </div>
        }>
            <ForgotPasswordContent />
        </Suspense>
    );
}
