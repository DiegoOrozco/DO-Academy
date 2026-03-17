import { getAuthUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { Mail, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import VerifyStatusClient from "./VerifyStatusClient";

export default async function VerifyStatusPage() {
    const user = await getAuthUser();

    if (!user) {
        redirect("/login");
    }

    if (user.emailVerified) {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6 pt-32">
            <div className="max-w-md w-full relative">
                {/* Decorative background blur */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full"></div>
                
                <div className="relative glass-effect p-10 rounded-3xl border border-emerald-500/20 text-center space-y-8 shadow-2xl">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                        <Mail className="w-10 h-10 text-emerald-400" />
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-3xl font-black text-white tracking-tight italic">¡CASI LISTO!</h1>
                        <div className="h-1 w-12 bg-emerald-500 mx-auto rounded-full"></div>
                        <p className="text-slate-400 font-medium leading-relaxed">
                            Hemos enviado un enlace de verificación a: <br />
                            <span className="text-white font-bold">{user.email}</span>
                        </p>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl">
                        <p className="text-xs text-emerald-400/80 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                            <ShieldCheck size={14} />
                            Acceso Restringido
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                            Debes verificar tu correo antes de poder matricularte en cualquier curso.
                        </p>
                    </div>

                    <div className="space-y-4 pt-2">
                        <VerifyStatusClient email={user.email} />
                        
                        <div className="flex flex-col gap-2">
                            <Link href="/" className="text-slate-500 hover:text-white text-xs font-bold transition-colors">
                                Volver al inicio
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
