"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Linkedin, Twitter, Sparkles, Heart } from "lucide-react";

export default function Footer() {
    const pathname = usePathname();

    if (pathname.startsWith("/admin") || pathname.startsWith("/course/")) {
        return null;
    }

    return (
        <footer className="bg-[#050510] border-t border-white/5 pt-12 md:pt-20 pb-10 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="md:col-span-2 space-y-6">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-primary)] to-blue-400 rounded-lg flex items-center justify-center shadow-lg">
                                <span className="text-white font-black text-sm">DO</span>
                            </div>
                            <span className="text-lg font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                                Academy
                            </span>
                        </Link>
                        <p className="text-slate-400 text-sm max-w-sm leading-relaxed font-medium">
                            La plataforma definitiva para dominar el desarrollo moderno. Aprende con metodologías prácticas y proyectos reales diseñados para el mercado actual.
                        </p>
                        <div className="flex gap-4">
                            <SocialIcon href="#" icon={<Github size={18} />} />
                            <SocialIcon href="#" icon={<Linkedin size={18} />} />
                            <SocialIcon href="#" icon={<Twitter size={18} />} />
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6 flex items-center gap-2">
                            <Sparkles size={16} className="text-blue-400" />
                            Plataforma
                        </h4>
                        <ul className="space-y-4">
                            <FooterLink href="/">Catálogo</FooterLink>
                            <FooterLink href="/#my-courses">Mis Cursos</FooterLink>
                            <FooterLink href="/about">Sobre Mí</FooterLink>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6">Legal</h4>
                        <ul className="space-y-4">
                            <FooterLink href="#">Términos</FooterLink>
                            <FooterLink href="#">Privacidad</FooterLink>
                            <FooterLink href="#">Cookies</FooterLink>
                            <FooterLink href="/admin">Portal Admin</FooterLink>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                        © {new Date().getFullYear()} DO Academy. Hecho con <Heart size={12} className="text-red-500 fill-red-500" /> por Diego Orozco.
                    </p>
                    <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-600 italic">
                        <span>Aprende</span>
                        <span className="text-slate-800">•</span>
                        <span>Construye</span>
                        <span className="text-slate-800">•</span>
                        <span>Transforma</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <li>
            <Link href={href} className="text-slate-400 hover:text-white transition-colors text-sm font-medium">
                {children}
            </Link>
        </li>
    );
}

function SocialIcon({ href, icon }: { href: string, icon: React.ReactNode }) {
    return (
        <a
            href={href}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/10 border border-transparent transition-all"
        >
            {icon}
        </a>
    );
}
