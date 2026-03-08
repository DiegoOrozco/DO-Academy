"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, MessageSquare, Settings, LogOut, Menu, X, Users, GraduationCap, ShieldAlert } from "lucide-react";
import { logoutAdmin } from "../../../actions/auth";

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();

    const navLinks = [
        { name: "Dashboard", href: "/admin", icon: <LayoutDashboard size={18} /> },
        { name: "Mis Cursos", href: "/admin/courses", icon: <BookOpen size={18} /> },
        { name: "Libro de Calificaciones", href: "/admin/grades", icon: <GraduationCap size={18} /> },
        { name: "Estudiantes", href: "/admin/students", icon: <Users size={18} /> },
        { name: "Ajustes del Sitio", href: "/admin/settings", icon: <Settings size={18} /> },
        { name: "Reporte de Plagio", href: "/admin/plagiarism", icon: <ShieldAlert size={18} /> },
        { name: "Q&A Inbox", href: "/admin/qa", icon: <MessageSquare size={18} /> },
    ];

    return (
        <div className="flex h-screen bg-[var(--background)] overflow-hidden">
            {/* Mobile Header Toggle */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--color-background-dark)] border-b border-[var(--color-glass-border)] flex items-center justify-between px-6 z-40 backdrop-blur-md">
                <Link href="/admin" className="flex items-center gap-2 text-white font-bold">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white">
                        <span className="font-bold text-xs">DO</span>
                    </div>
                    <span className="text-sm">Admin</span>
                </Link>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-slate-400 hover:text-white"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Sidebar Overlay (Backdrop) */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] lg:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Drawer */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-[var(--color-background-dark)] border-r border-[var(--color-glass-border)] z-[60] transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
                }`}>
                <div className="p-6 border-b border-[var(--color-glass-border)] flex items-center justify-between">
                    <Link href="/admin" className="hidden lg:flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white glow-accent transition-all group-hover:scale-105">
                            <span className="font-bold text-sm">DO</span>
                        </div>
                        <h1 className="text-lg font-bold text-white leading-tight">DO Admin</h1>
                    </Link>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2 mt-4 lg:mt-0">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors relative ${isActive
                                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 shadow-lg shadow-blue-500/5"
                                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                {link.icon}
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-[var(--color-glass-border)]">
                    <form action={logoutAdmin}>
                        <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors text-left">
                            <LogOut size={18} />
                            Cerrar Sesión
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-y-auto custom-scrollbar pt-16 lg:pt-0 min-h-screen">
                <div className="absolute top-0 right-0 w-[60%] h-[500px] z-0 pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[100%] h-[100%] bg-[var(--color-primary)] opacity-[0.08] blur-[150px] rounded-full"></div>
                </div>
                <div className="relative z-10 p-4 sm:p-10 max-w-7xl mx-auto">{children}</div>
            </main>
        </div>
    );
}
