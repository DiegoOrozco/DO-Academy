"use client";

import { useState, useTransition } from "react";
import { resendVerificationEmail } from "@/actions/verify-actions";
import { Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";

export default function VerifyStatusClient({ email }: { email: string }) {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleResend = () => {
        setMessage(null);
        startTransition(async () => {
            const result = await resendVerificationEmail(email);
            if (result.success) {
                setMessage({ type: "success", text: result.message || "Correo reenviado con éxito" });
            } else {
                setMessage({ type: "error", text: result.error || "Error al reenviar el correo" });
            }
        });
    };

    return (
        <div className="space-y-4">
            {message && (
                <div className={`p-4 rounded-xl border text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                    message.type === "success" 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                    {message.type === "success" ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
                    <p className="font-medium">{message.text}</p>
                </div>
            )}

            <button
                onClick={handleResend}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-emerald-900/20 active:scale-[0.98]"
            >
                {isPending ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        Reenviando...
                    </>
                ) : (
                    <>
                        <Send size={18} />
                        Reenviar Correo de Verificación
                    </>
                )}
            </button>
        </div>
    );
}
