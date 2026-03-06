"use client";

import React from "react";

export default function SocialLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
    return (
        <a
            href={href}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/20 transition-all font-bold"
            target="_blank"
            rel="noopener noreferrer"
        >
            {icon}
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">{label}</span>
        </a>
    );
}
