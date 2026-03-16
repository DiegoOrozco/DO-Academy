"use client";

import React, { useState, useTransition } from "react";
import { User, Mail, Save, Shield, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { updateProfile } from "@/actions/profile-actions";

interface ProfileClientProps {
    user: {
        id: string;
        name: string;
        email: string;
        googleId: string | null;
        pendingEmail: string | null;
    };
}

export default function ProfileClient({ user }: ProfileClientProps) {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [isPending, startTransition] = useTransition();

    const isGoogleUser = !!user.googleId;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        startTransition(async () => {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("email", email);

            const result = await updateProfile(formData);

            if (result.success) {
                setMessage({ type: "success", text: result.message || "Perfil actualizado correctamente" });
            } else {
                setMessage({ type: "error", text: result.error || "Error al actualizar el perfil" });
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-blue-400 flex items-center justify-center text-white shadow-2xl shadow-blue-500/20">
                        <User size={40} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Mi Perfil</h1>
                        <p className="text-[var(--text-secondary)] mt-1">Gestiona tu información personal y configuración de cuenta.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <form onSubmit={handleSubmit} className="glass-effect p-8 rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] space-y-6 shadow-xl">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 ml-1">
                                        Nombre Completo
                                    </label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[var(--color-primary)] transition-colors" size={18} />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Tu nombre completo"
                                            className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-2xl py-4 pl-12 pr-4 text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-all shadow-inner font-medium"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 ml-1">
                                        Correo Electrónico
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[var(--color-primary)] transition-colors" size={18} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={isGoogleUser}
                                            placeholder="tu@correo.com"
                                            className={`w-full bg-[var(--background)] border border-[var(--border-color)] rounded-2xl py-4 pl-12 pr-4 text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-all shadow-inner font-medium ${isGoogleUser ? "opacity-50 cursor-not-allowed" : ""}`}
                                            required
                                        />
                                    </div>
                                    {isGoogleUser && (
                                        <p className="mt-2 text-[10px] text-blue-400 font-bold flex items-center gap-1.5 ml-1">
                                            <Shield size={12} />
                                            AUTENTICADO CON GOOGLE - CORREO PROTEGIDO
                                        </p>
                                    )}
                                </div>
                            </div>

                            {user.pendingEmail && (
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 animate-pulse">
                                    <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <p className="text-xs font-bold text-amber-200 uppercase tracking-wider">Verificación Pendiente</p>
                                        <p className="text-xs text-amber-200/80 mt-1">
                                            Hemos enviado un link a <strong>{user.pendingEmail}</strong>. Por favor verifícalo para completar el cambio.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {message && (
                                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in-95 ${message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                                    {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                    <p className="text-sm font-bold">{message.text}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-blue-600 disabled:opacity-50 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98]"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        Guardar Cambios
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Sidebar / Info */}
                    <div className="space-y-6">
                        <div className="glass-effect p-6 rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-lg">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-primary)] mb-4">Estado de Cuenta</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[var(--text-secondary)] font-medium">Autenticación</span>
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${isGoogleUser ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-white/5 text-slate-400 border border-white/5"}`}>
                                        {isGoogleUser ? "Google Auth" : "Email / Pass"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[var(--text-secondary)] font-medium">Verificación</span>
                                    <span className="px-2 py-1 rounded-lg text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black uppercase tracking-wider">
                                        Activa
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 shadow-lg">
                            <h4 className="text-white font-bold mb-2">Seguridad de tu Cuenta</h4>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                Si cambias tu correo electrónico, recibirás un enlace de confirmación. Tu cuenta seguirá vinculada a tu nombre y progreso actual.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
