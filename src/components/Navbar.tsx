"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    BookOpen,
    User as UserIcon,
    LogOut,
    Menu,
    X,
    Info,
    Shield,
    GraduationCap
} from "lucide-react";
import { useState, useEffect } from "react";

import { logoutStudent, logoutAdmin } from "@/actions/auth";

interface NavbarProps {
    user: any;
}

export default function Navbar({ user }: NavbarProps) {
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        if (user?.role === "ADMIN") {
            await logoutAdmin();
        } else {
            await logoutStudent();
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (pathname.startsWith("/course/") || pathname.startsWith("/admin")) {
        return null;
    }

    const navLinks = [
        { name: "Inicio", href: "/", icon: <Home size={18} /> },
    ];

    if (!user) {
        navLinks.push({ name: "Sobre Mí", href: "/about", icon: <Info size={18} /> });
    }

    if (user?.role === "STUDENT") {
        navLinks.splice(1, 0, { name: "Mis Cursos", href: "/#my-courses", icon: <BookOpen size={18} /> });
        navLinks.splice(2, 0, { name: "Mis Calificaciones", href: "/grades", icon: <GraduationCap size={18} /> });
    } else if (user?.role === "ADMIN") {
        navLinks.push({ name: "Panel Admin", href: "/admin", icon: <Shield size={18} /> });
    }

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? "py-3 bg-[rgba(10,10,26,0.8)] backdrop-blur-xl border-b border-[var(--color-glass-border)] shadow-2xl"
                : "py-6 bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[var(--color-primary)] to-blue-400 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                        <span className="text-white font-black text-lg md:text-xl">DO</span>
                    </div>
                    <span className="text-lg md:text-xl font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                        Academy
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isActive
                                        ? "bg-[var(--color-primary)] text-white shadow-lg shadow-blue-500/30"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    {link.icon}
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="w-px h-6 bg-slate-800"></div>

                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end mr-2">
                                <span className="text-xs font-bold text-white leading-none">{user.name}</span>
                                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">
                                    {user.role === "ADMIN" ? "Administrador" : "Estudiante"}
                                </span>
                            </div>
                            <div className="relative group">
                                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 overflow-hidden cursor-pointer group-hover:border-[var(--color-primary)] transition-colors">
                                    <UserIcon size={20} />
                                </div>
                                {/* Dropdown placeholder or action */}
                                <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-[#1a1a2e] border border-slate-800 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform translate-y-2 group-hover:translate-y-0 z-50">
                                    <button
                                        onClick={() => handleLogout()}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors font-semibold"
                                    >
                                        <LogOut size={16} />
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 font-bold">
                            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
                                Entrar
                            </Link>
                            <Link
                                href="/register"
                                className="bg-[var(--color-primary)] hover:bg-blue-600 text-white text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20"
                            >
                                Empezar Gratis
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <div className={`fixed inset-0 top-[72px] bg-[var(--background)] z-40 transition-all duration-300 md:hidden ${isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                }`}>
                <div className="p-6 space-y-6">
                    <div className="flex flex-col gap-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-4 p-4 rounded-2xl text-lg font-bold transition-all ${pathname === link.href
                                    ? "bg-blue-600 text-white shadow-xl"
                                    : "bg-slate-900/50 text-slate-400 border border-slate-800"
                                    }`}
                            >
                                {link.icon}
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="pt-6 border-t border-slate-800 flex flex-col gap-4">
                        {user ? (
                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    handleLogout();
                                }}
                                className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-500/10 text-red-500 font-bold border border-red-500/20"
                            >
                                <LogOut size={20} />
                                Cerrar Sesión
                            </button>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center justify-center p-4 rounded-2xl bg-slate-900/50 text-white font-bold border border-slate-800"
                                >
                                    Iniciar Sesión
                                </Link>
                                <Link
                                    href="/register"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center justify-center p-4 rounded-2xl bg-[var(--color-primary)] text-white font-bold shadow-xl shadow-blue-600/20"
                                >
                                    Crear Cuenta
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
