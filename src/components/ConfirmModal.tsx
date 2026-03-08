"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    isLoading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "danger",
    isLoading = false
}: ConfirmModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleEsc);
            document.body.style.overflow = "hidden";
        }
        return () => {
            window.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    const variantStyles = {
        danger: "bg-red-600 hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.3)]",
        warning: "bg-amber-500 hover:bg-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.3)]",
        info: "bg-[var(--color-primary)] hover:bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
    };

    const modalContent = (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-md glass-effect rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Container */}
                <div className="p-8">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center text-center space-y-5">
                        <div className={`p-4 rounded-2xl ${variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            <AlertTriangle size={36} />
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-2xl font-black text-white tracking-tight">{title}</h3>
                            <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="bg-white/5 p-6 flex gap-4 border-t border-white/5">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-sm font-black uppercase tracking-wider transition-all border border-white/5 active:scale-95"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 px-5 py-3 rounded-2xl text-white text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 ${variantStyles[variant]}`}
                    >
                        {isLoading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Procesando...
                            </>
                        ) : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
