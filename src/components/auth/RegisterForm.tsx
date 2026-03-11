"use client";

import { useState, useTransition } from "react";
import { Key, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { registerStudent } from "@/actions/auth";

interface RegisterFormProps {
    courseId?: string;
    initialError?: string;
}

export default function RegisterForm({ courseId, initialError }: RegisterFormProps) {
    const [isPending, startTransition] = useTransition();
    const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string }>({});
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState("");

    const passwordRules = [
        { label: "Mínimo 6 caracteres", ok: password.length >= 6 },
        { label: "Al menos una letra", ok: /[a-zA-Z]/.test(password) },
    ];

    function validate(name: string, email: string, pw: string, confirm: string) {
        const e: typeof errors = {};
        if (!name.trim()) e.name = "El nombre es requerido.";
        if (!email) e.email = "El correo electrónico es requerido.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Ingresa un correo válido.";
        if (!pw) e.password = "La contraseña es requerida.";
        else if (pw.length < 6) e.password = "Mínimo 6 caracteres.";
        if (pw !== confirm) e.confirm = "Las contraseñas no coinciden.";
        return e;
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = e.currentTarget;
        const name = (form.elements.namedItem("name") as HTMLInputElement).value;
        const email = (form.elements.namedItem("email") as HTMLInputElement).value;
        const pw = (form.elements.namedItem("password") as HTMLInputElement).value;
        const confirm = (form.elements.namedItem("confirm") as HTMLInputElement).value;

        const validationErrors = validate(name, email, pw, confirm);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});
        const formData = new FormData(form);
        startTransition(async () => {
            await registerStudent(formData);
        });
    }

    const fieldClass = (hasError: boolean) =>
        `w-full bg-[rgba(0,0,0,0.3)] border rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${hasError ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30' : 'border-[var(--color-glass-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]'}`;

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Server-side errors */}
            {initialError === "exists" && (
                <div className="bg-orange-500/10 text-orange-400 text-sm p-4 rounded-xl border border-orange-500/20 flex items-start gap-3">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <p className="font-medium">Este correo ya está registrado. <a href="/login" className="underline font-bold">Inicia sesión aquí.</a></p>
                </div>
            )}
            {initialError === "google_linked" && (
                <div className="bg-orange-500/10 text-orange-400 text-sm p-4 rounded-xl border border-orange-500/20 flex items-start gap-3">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <p className="font-medium">Este correo está vinculado a Google. Usa el botón "Comenzar con Google".</p>
                </div>
            )}

            {courseId && <input type="hidden" name="courseId" value={courseId} />}

            {/* Name */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-300">Nombre Completo</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </span>
                    <input
                        type="text"
                        name="name"
                        autoComplete="name"
                        className={fieldClass(!!errors.name)}
                        placeholder="Julio Perez"
                        onChange={() => errors.name && setErrors(p => ({ ...p, name: undefined }))}
                    />
                </div>
                {errors.name && <p className="text-xs text-red-400 flex items-center gap-1.5 font-medium"><AlertCircle size={12} />{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-300">Correo Electrónico</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </span>
                    <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        className={fieldClass(!!errors.email)}
                        placeholder="tunombre@ejemplo.com"
                        onChange={() => errors.email && setErrors(p => ({ ...p, email: undefined }))}
                    />
                </div>
                {errors.email && <p className="text-xs text-red-400 flex items-center gap-1.5 font-medium"><AlertCircle size={12} />{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-300">Contraseña</label>
                <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete="new-password"
                        className={`${fieldClass(!!errors.password)} pr-10`}
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (errors.password) setErrors(p => ({ ...p, password: undefined }));
                        }}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {/* Password strength hints */}
                {password.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1.5">
                        {passwordRules.map(rule => (
                            <span key={rule.label} className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${rule.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-slate-500 border border-white/5'}`}>
                                {rule.ok ? '✓' : '○'} {rule.label}
                            </span>
                        ))}
                    </div>
                )}
                {errors.password && <p className="text-xs text-red-400 flex items-center gap-1.5 font-medium"><AlertCircle size={12} />{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-300">Confirmar Contraseña</label>
                <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type={showPassword ? "text" : "password"}
                        name="confirm"
                        autoComplete="new-password"
                        className={fieldClass(!!errors.confirm)}
                        placeholder="Repite tu contraseña"
                        onChange={() => errors.confirm && setErrors(p => ({ ...p, confirm: undefined }))}
                    />
                </div>
                {errors.confirm && <p className="text-xs text-red-400 flex items-center gap-1.5 font-medium"><AlertCircle size={12} />{errors.confirm}</p>}
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 mt-4 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
            >
                {isPending ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        Creando cuenta...
                    </>
                ) : (
                    "Comenzar Ahora →"
                )}
            </button>
        </form>
    );
}
