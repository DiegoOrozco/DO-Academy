import prisma from "@/lib/prisma";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token: string }> }) {
    const { token } = await searchParams;

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-dark)] px-4">
                <div className="glass-effect p-10 rounded-3xl border border-white/10 text-center space-y-4 max-w-md w-full">
                    <XCircle size={60} className="text-red-500 mx-auto" />
                    <h1 className="text-3xl font-bold text-white">Token Inválido</h1>
                    <p className="text-slate-400">El enlace de verificación no es válido o ha expirado.</p>
                    <Link href="/" className="inline-block px-8 py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold hover:glow-accent transition-all">
                        Ir al Inicio
                    </Link>
                </div>
            </div>
        );
    }

    const user = await prisma.user.findUnique({
        where: { verificationToken: token }
    });

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-dark)] px-4">
                <div className="glass-effect p-10 rounded-3xl border border-white/10 text-center space-y-4 max-w-md w-full">
                    <XCircle size={60} className="text-red-500 mx-auto" />
                    <h1 className="text-3xl font-bold text-white">Token No Encontrado</h1>
                    <p className="text-slate-400">No pudimos encontrar una cuenta asociada a este enlace.</p>
                    <Link href="/" className="inline-block px-8 py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold hover:glow-accent transition-all">
                        Ir al Inicio
                    </Link>
                </div>
            </div>
        );
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerified: true,
            verificationToken: null
        }
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-dark)] px-4">
            <div className="glass-effect p-10 rounded-3xl border border-white/10 text-center space-y-6 max-w-md w-full">
                <CheckCircle2 size={60} className="text-green-500 mx-auto" />
                <div>
                    <h1 className="text-3xl font-bold text-white">¡Correo Verificado!</h1>
                    <p className="text-slate-400 mt-2">Tu cuenta ha sido activada correctamente. Ya puedes acceder a todos tus cursos.</p>
                </div>
                <Link href="/login" className="inline-block w-full px-8 py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold hover:glow-accent transition-all">
                    Iniciar Sesión
                </Link>
            </div>
        </div>
    );
}
