import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { unlockCourse } from "../../../../actions/auth";
import { getStudent } from "@/lib/student-auth";

export default async function UnlockCoursePage({
    params,
    searchParams,
}: {
    params: Promise<{ courseId: string }>;
    searchParams: Promise<{ error?: string }>;
}) {
    const { courseId } = await params;
    const { error } = await searchParams;

    // Check if student is logged in
    const student = await getStudent();
    if (!student) {
        redirect("/login");
    }

    const isAdmin = student.role === "ADMIN";
    const hasAccess = isAdmin || student.enrollments.some((e: any) => e.courseId === courseId && e.status === "ACTIVE");

    if (hasAccess) {
        redirect(`/course/${courseId}`);
    }

    const isInactive = student.enrollments.some((e: any) => e.courseId === courseId && e.status === "INACTIVE");

    // Bind server action
    const unlockAction = unlockCourse.bind(null, courseId);

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
                        <Lock className="w-10 h-10 text-slate-300" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Desbloquear Curso</h1>
                    <p className="text-slate-400 font-medium tracking-wide">
                        Hola <span className="text-white font-bold">{student.name}</span>, ingresa la contraseña para matricularte.
                    </p>
                </div>

                <div className="glass-effect rounded-2xl p-8 shadow-2xl border border-[var(--color-glass-border)]">
                    {isInactive && (
                        <div className="mb-6 bg-amber-500/20 text-amber-500 text-sm p-4 rounded-xl border border-amber-500/30 text-center font-bold">
                            ⚠️ Tu acceso a este curso ha sido desactivado. Por favor, contacta con el administrador.
                        </div>
                    )}
                    {error === "incorrect" && (
                        <div className="mb-4 bg-red-500/20 text-red-500 text-sm p-3 rounded-lg border border-red-500/30 text-center font-medium">
                            Contraseña incorrecta. Inténtalo de nuevo.
                        </div>
                    )}
                    {error === "db" && (
                        <div className="mb-4 bg-red-500/20 text-red-500 text-sm p-3 rounded-lg border border-red-500/30 text-center font-medium">
                            Error al procesar la matrícula.
                        </div>
                    )}

                    {!isInactive && (
                        <form action={unlockAction} className="space-y-5">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-300">
                                    Contraseña del Curso
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    className="w-full bg-[rgba(0,0,0,0.3)] border border-[var(--color-glass-border)] rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-[var(--color-primary)] hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 glow-accent mt-4 flex items-center justify-center gap-2 font-bold"
                            >
                                <Lock size={18} />
                                Desbloquear con Contraseña
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

