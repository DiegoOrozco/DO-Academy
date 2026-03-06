import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { loginAdmin } from "../../../actions/auth";
import { verifySession } from "@/lib/session";

export default async function AdminLoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;
    const cookieStore = await cookies();
    const isAdmin = verifySession(cookieStore.get("admin_session")?.value) === "valid";

    if (isAdmin) {
        redirect("/admin");
    }

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[50%] h-[100%] bg-red-500 opacity-[0.10] blur-[150px] rounded-full"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft size={16} /> Volver al catálogo
                </Link>

                <div className="text-center mb-8">
                    <div className="inline-block p-4 rounded-2xl glass-effect mb-4 shadow-[0_0_15px_rgba(239,68,68,0.1)] border border-red-500/20">
                        <Shield className="w-10 h-10 text-red-400" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Acceso Restringido</h1>
                    <p className="text-slate-400 font-medium tracking-wide">Portal de administración para profesores.</p>
                </div>

                {/* Login Card */}
                <div className="glass-effect rounded-2xl p-8 shadow-2xl border border-[var(--color-glass-border)]">
                    {error === "incorrect" && (
                        <div className="mb-4 bg-red-500/20 text-red-500 text-sm p-3 rounded-lg border border-red-500/30 text-center font-medium">
                            Credenciales incorrectas. Acceso denegado.
                        </div>
                    )}

                    <form action={loginAdmin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Contraseña Maestra
                            </label>
                            <input
                                type="password"
                                name="password"
                                required
                                className="w-full bg-[rgba(0,0,0,0.3)] border border-[var(--color-glass-border)] rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.3)] mt-4 flex items-center justify-center gap-2"
                        >
                            <Shield size={18} />
                            Iniciar Sesión Segura
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
