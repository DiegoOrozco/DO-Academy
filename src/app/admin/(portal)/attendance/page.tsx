"use client";

import { useState, useEffect } from "react";
import { createAttendanceSession, getActiveSession } from "@/actions/attendance";
import { Copy, Timer, CheckCircle, RefreshCw, Key, Sheet } from "lucide-react";

export default function AttendanceAdminPage() {
    const [sheetName, setSheetName] = useState("101");
    const [session, setSession] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    const fetchSession = async () => {
        const active = await getActiveSession();
        setSession(active);
        if (active) {
            updateTimeLeft(active.expiresAt);
        }
    };

    useEffect(() => {
        fetchSession();
    }, []);

    useEffect(() => {
        if (!session) return;

        const timer = setInterval(() => {
            updateTimeLeft(session.expiresAt);
        }, 1000);

        return () => clearInterval(timer);
    }, [session]);

    const updateTimeLeft = (expiry: Date) => {
        const remaining = Math.max(0, new Date(expiry).getTime() - Date.now());
        setTimeLeft(Math.floor(remaining / 1000));
        if (remaining <= 0) {
            setSession(null);
        }
    };

    const handleGenerateCode = async () => {
        setIsLoading(true);
        try {
            const newSession = await createAttendanceSession(sheetName);
            setSession(newSession);
        } catch (error) {
            alert("Error al generar sesión");
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-black text-white mb-2">Pase de Lista Automático</h1>
                <p className="text-slate-400">Genera una clave temporal para que los estudiantes registren su asistencia en Google Sheets.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Control Panel */}
                <div className="glass-effect rounded-3xl p-8 border border-white/10 space-y-6">
                    <div className="flex items-center gap-3 text-white font-bold text-xl mb-4">
                        <Key size={24} className="text-[var(--color-primary)] text-glow" />
                        Control de Sesión
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <Sheet size={14} /> Nombre de la Hoja
                            </label>
                            <input
                                type="text"
                                value={sheetName}
                                onChange={(e) => setSheetName(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                                placeholder="Ej: 101"
                            />
                            <p className="text-[10px] text-slate-500 italic">Cada 3 semanas asegúrate de cambiar este valor según corresponda en tu Google Sheet.</p>
                        </div>

                        <button
                            onClick={handleGenerateCode}
                            disabled={isLoading}
                            className="w-full bg-[var(--color-primary)] hover:bg-blue-600 disabled:opacity-50 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 overflow-hidden relative group"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <span className="relative flex items-center gap-2">
                                {isLoading ? <RefreshCw className="animate-spin" /> : <RefreshCw />}
                                {session ? "Reiniciar Clave" : "Generar Clave de 5 min"}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Status Display */}
                <div className="glass-effect rounded-3xl p-8 border border-white/10 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    {session ? (
                        <>
                            <div className="absolute top-0 right-0 p-4">
                                <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                                    Activo
                                </div>
                            </div>

                            <div className="mb-6 space-y-1">
                                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Clave Activa</p>
                                <div className="text-7xl font-black text-white tracking-widest text-glow">
                                    {session.code}
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-center">
                                    <div className="text-2xl font-black text-white flex items-center gap-2">
                                        <Timer className="text-orange-400" size={20} />
                                        {formatTime(timeLeft || 0)}
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Tiempo Restante</p>
                                </div>
                                <div className="w-px h-10 bg-white/10"></div>
                                <div className="flex flex-col items-center">
                                    <div className="text-lg font-black text-white uppercase tracking-tight">
                                        Hoja: {session.sheetName}
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Destino</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="py-12 space-y-4">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/5">
                                <CheckCircle size={40} className="text-slate-600" />
                            </div>
                            <p className="text-slate-500 font-bold">Sin clave activa</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Help Card */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-3xl p-6 flex gap-4 items-start">
                <div className="p-2 rounded-xl bg-blue-500/20">
                    <Copy size={20} className="text-blue-400" />
                </div>
                <div>
                    <h4 className="text-white font-bold mb-1">Instrucciones para Estudiantes</h4>
                    <p className="text-slate-400 text-sm">Indica a tus alumnos que ingresen a <span className="text-blue-400 font-mono">/asistencia</span> desde sus dispositivos personales. Allí aparecerá la lista de nombres para que ellos se seleccionen y pongan la clave que generaste arriba.</p>
                </div>
            </div>
        </div>
    );
}
