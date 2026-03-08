"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";

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

    if (!isOpen) return null;

    const variantStyles = {
        danger: "bg-red-600 hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.3)]",
        warning: "bg-amber-500 hover:bg-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.3)]",
        info: "bg-[var(--color-primary)] hover:bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-md glass-effect rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Container */}
                <div className="p-6">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className={`p-3 rounded-full ${variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            <AlertTriangle size={32} />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="bg-white/5 p-4 flex gap-3 border-t border-white/5">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-all border border-white/5"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all flex items-center justify-center gap-2 ${variantStyles[variant]}`}
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
}
