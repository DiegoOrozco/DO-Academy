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
    GraduationCap,
    ArrowRight
} from "lucide-react";
import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";

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
        { name: "Cursos", href: "/courses", icon: <BookOpen size={18} /> },
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
        <>
        <nav
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 nav-blur"
            style={{
                background: isScrolled ? 'rgba(14,14,19,0.98)' : 'rgba(14,14,19,0.88)',
                borderBottom: '1px solid var(--raw-outline-dim)',
                fontFamily: "'Space Grotesk', sans-serif",
                paddingTop: 'var(--safe-top)'
            }}
        >
            {user?.role === "ADMIN" && (
                <div
                    className="text-[10px] font-black uppercase tracking-[0.2em] py-1.5 px-4 flex items-center justify-center gap-4"
                    style={{ background: 'var(--raw-accent)', color: 'var(--raw-bg)' }}
                >
                    <Shield size={11} />
                    Modo Admin
                    <span style={{ opacity: 0.4 }}>·</span>
                    <Link href="/admin" className="underline flex items-center gap-1">
                        Ir al Panel <ArrowRight size={10} />
                    </Link>
                </div>
            )}

            <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex justify-between items-center h-16 md:h-20">
                {/* Logo */}
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <div className="flex flex-col">
                        <span
                            className="font-black text-lg md:text-xl tracking-tighter leading-none"
                            style={{ color: 'var(--raw-accent)', letterSpacing: '-0.03em' }}
                        >
                            DO ACADEMY
                        </span>
                    </div>
                </Link>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-8">
                    <div className="flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-[11px] font-black uppercase tracking-widest px-4 py-2 transition-all hover:text-[var(--raw-accent)]"
                                    style={{
                                        color: isActive ? 'var(--raw-accent)' : 'var(--raw-slate)',
                                    }}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>

                    <div style={{ width: '1px', height: '24px', background: 'var(--raw-outline-dim)' }} />

                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[11px] font-black uppercase tracking-widest text-white">
                                    {user.name.split(" ")[0]}
                                </span>
                                <span className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--raw-accent)' }}>
                                    {user.role === "ADMIN" ? "ADMINISTRADOR" : "ESTUDIANTE"}
                                </span>
                            </div>
                            <div className="relative group">
                                <div
                                    className="w-10 h-10 flex items-center justify-center text-sm font-black cursor-pointer rounded-full overflow-hidden"
                                    style={{
                                        background: 'var(--raw-surface-highest)',
                                        border: '1px solid var(--raw-accent)',
                                        color: 'var(--raw-accent)',
                                    }}
                                >
                                    {user.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                                </div>
                                <div
                                    className="absolute right-0 top-full mt-2 w-48 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 rounded-xl"
                                    style={{ background: 'var(--raw-surface-low)', border: '1px solid var(--raw-outline-dim)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                                >
                                    <Link
                                        href="/profile"
                                        className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors"
                                        style={{ color: 'var(--raw-slate)' }}
                                    >
                                        <UserIcon size={14} /> Mi Perfil
                                    </Link>
                                    <button
                                        onClick={() => handleLogout()}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-colors"
                                        style={{ color: 'var(--raw-error)' }}
                                    >
                                        <LogOut size={14} /> Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link
                                href="/login"
                                className="text-[11px] font-black uppercase tracking-widest transition-colors hover:text-white"
                                style={{ color: 'var(--raw-slate)' }}
                            >
                                Iniciar Sesión
                            </Link>
                            <Link
                                href="/register"
                                className="raw-btn-primary text-[11px] py-3 px-6"
                            >
                                Registrarse →
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile toggle */}
                <button
                    className="md:hidden flex items-center gap-2 text-[10px] font-black uppercase bg-white/5 px-4 py-2 rounded-full border border-white/10 relative z-[110]"
                    style={{ color: 'var(--raw-on-surface)' }}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? "CERRAR" : "MENÚ"}
                    {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
            </div>
        </nav>

            {/* Mobile menu - Rendered outside <nav> to avoid backdrop-filter clipping */}
            <div
                className={`fixed inset-0 md:hidden transition-all duration-300 ${isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}`}
                style={{ 
                    background: 'rgba(14,14,19,0.98)', 
                    backdropFilter: 'blur(20px)',
                    zIndex: 100, 
                    top: 0 
                }}
            >
                <div className="flex flex-col h-full">
                    {/* Mobile menu header */}
                    <div className="flex justify-between items-center h-14 px-6 border-b border-[var(--raw-outline-dim)]">
                        <span className="font-black text-sm tracking-tighter" style={{ color: 'var(--raw-accent)' }}>
                            DO ACADEMY
                        </span>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            style={{ color: 'var(--raw-slate)' }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8 flex flex-col gap-2 overflow-y-auto">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-4 py-5 text-lg font-black uppercase tracking-[0.15em]"
                                style={{
                                    color: pathname === link.href ? 'var(--raw-accent)' : 'var(--raw-slate)',
                                    borderBottom: '1px solid var(--raw-outline-dim)',
                                }}
                            >
                                {link.name}
                            </Link>
                        ))}
                        
                        <div className="mt-10 flex flex-col gap-4">
                            {user ? (
                                <button
                                    onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                                    className="flex items-center justify-center gap-2 p-5 text-sm font-black uppercase tracking-widest w-full"
                                    style={{ color: 'var(--raw-error)', border: '1px solid var(--raw-error)', opacity: 0.8 }}
                                >
                                    <LogOut size={16} /> Cerrar Sesión
                                </button>
                            ) : (
                                <>
                                    <Link 
                                        href="/login" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center justify-center p-5 text-sm font-black uppercase tracking-widest w-full"
                                        style={{ color: 'var(--raw-on-surface)', border: '1px solid var(--raw-outline-dim)' }}
                                    >Iniciar Sesión</Link>
                                    <Link 
                                        href="/register" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="raw-btn-primary flex items-center justify-center p-5 text-sm w-full"
                                    >Registrarse →</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
