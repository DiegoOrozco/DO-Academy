import Link from "next/link";
import { LayoutDashboard, BookOpen, MessageSquare, Settings, LogOut } from "lucide-react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-[var(--background)] overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-64 flex-shrink-0 flex flex-col border-r border-[var(--color-glass-border)] bg-[var(--color-background-dark)]/90 backdrop-blur-xl z-20">
                <div className="p-6 border-b border-[var(--color-glass-border)]">
                    <Link href="/admin" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white glow-accent transition-all group-hover:scale-105">
                            <span className="font-bold text-sm">DO</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white leading-tight">DO Academy</h1>
                            <p className="text-xs text-[var(--color-secondary)] font-medium">Portal Profesor</p>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    <Link
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-300 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
                    >
                        <LayoutDashboard size={18} />
                        Dashboard
                    </Link>
                    <Link
                        href="/admin/courses"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-300 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
                    >
                        <BookOpen size={18} />
                        Mis Cursos
                    </Link>
                    <Link
                        href="/admin/qa"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-300 rounded-xl hover:bg-white/5 hover:text-white transition-colors relative"
                    >
                        <MessageSquare size={18} />
                        Q&A Inbox
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-[var(--color-primary)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            4
                        </span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-[var(--color-glass-border)]">
                    <Link
                        href="/login"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                        <LogOut size={18} />
                        Cerrar Sesión
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-y-auto custom-scrollbar">
                {/* Decorative Background for Admin Area */}
                <div className="absolute top-0 right-0 w-[60%] h-[500px] z-0 pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[100%] h-[100%] bg-[var(--color-primary)] opacity-[0.08] blur-[150px] rounded-full"></div>
                </div>

                <div className="relative z-10 p-6 sm:p-10 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
