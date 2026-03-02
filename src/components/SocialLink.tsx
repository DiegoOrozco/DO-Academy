"use client";

import React from "react";

export default function SocialLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
    return (
        <a
            href={href}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-bold"
            target="_blank"
            rel="noopener noreferrer"
        >
            {icon}
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">{label}</span>
        </a>
    );
}
