"use client";

import { useState, useEffect } from "react";
import { getActiveSession, getStudentList, submitStudentAttendance, getTodayAttendanceLog } from "@/actions/attendance";
import { User, Key, CheckCircle, AlertCircle, Search, Loader2, ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";

export default function StudentCheckInPage() {
    const [session, setSession] = useState<any>(null);
    const [students, setStudents] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStudent, setSelectedStudent] = useState("");
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
    const [lockedName, setLockedName] = useState<string | null>(null);
    const [checkInStep, setCheckInStep] = useState<number>(0);

    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isFetchingStudents, setIsFetchingStudents] = useState(false);

    useEffect(() => {
        const init = async () => {
            setIsFetchingStudents(true);
            setFetchError(null);
            try {
                const active = await getActiveSession();
                setSession(active);
                if (active) {
                    // Also check for existing log today
                    const log = await getTodayAttendanceLog(active.sheetName);
                    if (log) {
                        setCheckInStep(log.checkIns);
                        if (log.checkIns === 1) {
                            setLockedName(log.studentName);
                            setSelectedStudent(log.studentName);
                            setSearchTerm(log.studentName);
                        } else if (log.checkIns >= 2) {
                            setMessage({ type: "success", text: "Ya completaste ambos check-ins hoy. ¡Tu asistencia ya está registrada!" });
                        }
                    }

                    const res = await getStudentList(active.sheetName);
                    if (res.success) {
                        setStudents(res.data || []);
                    } else {
                        setFetchError(res.error || "Error desconocido.");
                        console.error("Fetch error:", res.debug);
                    }
                }
            } catch (error) {
                console.error("Init error:", error);
                setFetchError("Error al conectar con el servidor.");
            } finally {
                setIsFetchingStudents(false);
            }
        };
        init();
    }, []);

    const filteredStudents = students.filter(s =>
        s.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent || !code) return;

        setIsLoading(true);
        setMessage(null);

        try {
            const res = await submitStudentAttendance(selectedStudent, code);
            if (res.success) {
                if (res.step === 1) {
                    setMessage({ type: "info", text: res.message || "Primer check-in exitoso." });
                    setCheckInStep(1);
                    setLockedName(selectedStudent);
                } else {
                    setMessage({ type: "success", text: res.message || "Asistencia registrada con éxito." });
                    setCheckInStep(2);
                }
                setCode("");
            } else {
                setMessage({ type: "error", text: res.error || "Ocurrió un error." });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Error de conexión con el servidor." });
        } finally {
            setIsLoading(false);
        }
    };

    if (!session) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6 text-center">
                <div className="glass-effect p-12 rounded-3xl border border-white/10 max-w-md w-full space-y-6">
                    <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto border border-orange-500/20">
                        <AlertCircle className="text-orange-400" size={40} />
                    </div>
                    <h1 className="text-2xl font-black text-white">Sin Sesión Activa</h1>
                    <p className="text-slate-400">Pídele al profesor que genere una clave de asistencia.</p>
                    <Link href="/" className="inline-block text-[var(--color-primary)] font-bold hover:underline">
                        Volver al inicio
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6">
            <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[50%] h-[100%] bg-[var(--color-primary)] opacity-[0.15] blur-[150px] rounded-full"></div>
            </div>

            <div className="relative z-10 w-full max-w-lg space-y-8">
                <div className="text-center space-y-2">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-4 transition-colors">
                        <ArrowLeft size={16} /> Volver
                    </Link>
                    <h1 className="text-4xl font-black text-white tracking-tight">Registro de Asistencia</h1>
                    <p className="text-slate-400 font-medium">Selecciona tu nombre y pon la clave del día.</p>
                </div>

                <div className="glass-effect rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6">
                    {message && (
                        <div className={`p-4 rounded-2xl flex gap-3 items-center border ${message.type === "success"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                            : message.type === "info"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                                : "bg-red-500/10 text-red-500 border-red-500/20"
                            }`}>
                            {message.type === "success" ? <CheckCircle size={20} /> : message.type === "info" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            <span className="text-sm font-bold leading-relaxed">{message.text}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-300 uppercase tracking-widest pl-1">Tu Nombre Completo</label>

                            {lockedName ? (
                                <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl px-4 py-4 flex items-center justify-between text-white shadow-inner">
                                    <div className="flex items-center gap-3">
                                        <Lock className="text-slate-500" size={18} />
                                        <span className="font-semibold">{lockedName}</span>
                                    </div>
                                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Paso 1 Completado</span>
                                </div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Buscar tu nombre..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all font-medium"
                                        />
                                    </div>

                                    <div className="max-h-48 overflow-y-auto custom-scrollbar bg-black/20 border border-white/5 rounded-2xl p-2 space-y-1">
                                        {isFetchingStudents ? (
                                            <div className="flex flex-col items-center justify-center p-8 gap-2">
                                                <Loader2 className="animate-spin text-[var(--color-primary)]" size={24} />
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest animate-pulse">Cargando Estudiantes...</p>
                                            </div>
                                        ) : filteredStudents.length > 0 ? (
                                            filteredStudents.map(name => (
                                                <button
                                                    key={name}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedStudent(name);
                                                        setSearchTerm(name);
                                                    }}
                                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all text-sm font-medium ${selectedStudent === name
                                                        ? "bg-[var(--color-primary)] text-white shadow-lg"
                                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                                        }`}
                                                >
                                                    {name}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-8 text-center gap-2">
                                                <AlertCircle className="text-red-400" size={24} />
                                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-loose">
                                                    {fetchError || (students.length === 0
                                                        ? "No se pudo cargar la lista.\nVerifica con el profesor si la configuración es correcta."
                                                        : "No se encontraron coincidenas.")}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Code Input */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-300 uppercase tracking-widest pl-1">Clave de 5 min</label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    maxLength={5}
                                    required
                                    placeholder="Poner Clave..."
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all font-black text-2xl tracking-[0.3em] uppercase placeholder:tracking-normal placeholder:font-medium placeholder:text-sm"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !selectedStudent || !code || checkInStep >= 2}
                            className={`w-full ${checkInStep >= 2 ? 'bg-slate-700' : 'bg-[var(--color-primary)] hover:bg-blue-600'} text-white disabled:opacity-30 font-black py-5 rounded-2xl shadow-xl shadow-blue-500/30 transition-all flex items-center justify-center gap-3 relative overflow-hidden group`}
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <>
                                    <span>Registrar Asistencia</span>
                                    <CheckCircle size={20} className="group-hover:scale-110 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="text-center">
                    <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">DO Academy Automatic System</p>
                </div>
            </div>
        </div>
    );
}
