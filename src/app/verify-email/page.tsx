import { verifyNewEmail } from "@/actions/profile-actions";
import Link from "next/link";
import { CheckCircle2, XCircle, ArrowRight, BookOpen } from "lucide-react";

export default async function VerifyEmailPage({
    searchParams
}: {
    searchParams: Promise<{ token?: string }>
}) {
    const { token } = await searchParams;

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
                <div className="max-w-md w-full glass-effect p-8 rounded-3xl border border-rose-500/20 text-center space-y-4">
                    <XCircle className="w-16 h-16 text-rose-500 mx-auto" />
                    <h1 className="text-2xl font-black text-white">Token Faltante</h1>
                    <p className="text-slate-400">No se ha proporcionado un token de verificación válido.</p>
                    <Link href="/" className="inline-block text-[var(--color-primary)] font-bold hover:underline">
                        Volver al inicio
                    </Link>
                </div>
            </div>
        );
    }

    const result = await verifyNewEmail(token);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
            <div className={`max-w-md w-full glass-effect p-10 rounded-3xl border ${result.success ? 'border-emerald-500/20' : 'border-rose-500/20'} text-center space-y-6 shadow-2xl`}>
                {result.success ? (
                    <>
                        <div className="relative mx-auto w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-in zoom-in-50 duration-500" />
                            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping duration-1000 scale-75 opacity-50"></div>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">¡Correo Verificado!</h1>
                        <p className="text-slate-400 font-medium leading-relaxed">
                            Tu dirección de correo ha sido actualizada con éxito. A partir de ahora podrás iniciar sesión con tu nuevo correo.
                        </p>
                        <div className="pt-4 flex flex-col gap-3">
                            <Link href="/" className="flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20">
                                Ir al Inicio
                                <ArrowRight size={18} />
                            </Link>
                            <Link href="/profile" className="text-slate-400 hover:text-white font-bold text-sm transition-colors">
                                Volver a mi perfil
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <XCircle className="w-16 h-16 text-rose-500 mx-auto" />
                        <h1 className="text-3xl font-black text-white tracking-tight">Error de Verificación</h1>
                        <p className="text-slate-400 font-medium leading-relaxed">
                            {result.error || "El enlace de verificación es inválido o ha expirado."}
                        </p>
                        <div className="pt-4">
                            <Link href="/profile" className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all border border-white/10">
                                <UserIcon size={18} className="mr-1" />
                                Ir a Mi Perfil
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function UserIcon({ size, className }: { size: number, className?: string }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}
