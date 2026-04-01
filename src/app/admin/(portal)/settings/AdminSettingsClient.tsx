"use client";

import { useState, useRef } from "react";
import { updateSiteConfig, refreshTechNewsAI } from "@/actions/admin-settings";
import { Save, User, Home, Cpu, Loader2, Sparkles, X, Info } from "lucide-react";
import { processAllPendingSubmissions } from "@/actions/admin-grading";

export default function AdminSettingsClient({ initialConfigs }: { initialConfigs: any }) {
    const [configs, setConfigs] = useState(initialConfigs);
    const [isSaving, setIsSaving] = useState(false);
    const [isGrading, setIsGrading] = useState(false);
    const [isRefreshingNews, setIsRefreshingNews] = useState(false);
    const [activeTab, setActiveTab] = useState("home");
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleManualGrading = async () => {
        const customPrompt = window.prompt("Opcional: Añade instrucciones especiales o enunciados para la IA (ej. 'Revisar indentación'). Si lo dejas en blanco, se usará el enunciado predeterminado.");

        setIsGrading(true);
        try {
            const res: any = await processAllPendingSubmissions(customPrompt || undefined);
            if (res.success) {
                alert(`¡Proceso completado! Se han calificado ${res.processedCount} entregas.`);
            } else {
                alert("Error: " + res.error);
            }
        } catch (error) {
            alert("Error de conexión.");
        } finally {
            setIsGrading(false);
        }
    };

    const home = configs.home || {
        heroTitle: "Domina la Tecnología con DO Academy",
        heroSubtitle: "Accede a contenido exclusivo diseñado por expertos.",
        heroButtonText: "Empezar Ahora",
        heroButtonLink: "/register",
        news: []
    };

    const handleSave = async (key: string, value: any) => {
        setIsSaving(true);
        const res = await updateSiteConfig(key, value);
        setIsSaving(false);
        if (res.success) alert("Configuración guardada correctamente.");
        else alert("Error al guardar: " + res.error);
    };

    const updateHome = (updates: any) => {
        setConfigs((prev: any) => ({
            ...prev,
            home: { ...prev.home, ...updates }
        }));
    };

    return (
        <div className="space-y-8">
            {/* Tabs */}
            <div className="flex gap-2 p-2 bg-white/5 rounded-2xl border border-white/10 w-fit">
                <button onClick={() => setActiveTab("home")} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'home' ? 'bg-[#cde641] text-black' : 'text-white/40 hover:text-white'}`}>Inicio</button>
                <button onClick={() => setActiveTab("system")} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'system' ? 'bg-[#cde641] text-black' : 'text-white/40 hover:text-white'}`}>Sistema & IA</button>
            </div>

            {activeTab === "home" && (
                <div className="glass-effect rounded-3xl border border-white/10 p-8 space-y-8 animate-in fade-in">
                    <div className="flex items-center gap-3 pb-6 border-b border-white/5">
                        <Home className="text-[#cde641]" />
                        <h2 className="text-xl font-bold text-white tracking-tight">Configuración de Inicio</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Título Principal (Hero)</label>
                            <input 
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-[#cde641] transition-all outline-none"
                                value={home.heroTitle}
                                onChange={(e) => updateHome({ heroTitle: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Subtítulo (Hero)</label>
                            <textarea 
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white min-h-[100px] focus:border-[#cde641] transition-all outline-none"
                                value={home.heroSubtitle}
                                onChange={(e) => updateHome({ heroSubtitle: e.target.value })}
                            />
                        </div>

                        {/* NEWS SUB-EDITOR */}
                        <div className="pt-10 border-t border-white/5 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 italic">
                                    <Sparkles size={16} className="text-[#cde641]" /> NOTICIAS & INSIGHTS
                                </h3>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={async () => {
                                            setIsRefreshingNews(true);
                                            try {
                                                const res = await refreshTechNewsAI();
                                                if (res.success) {
                                                    updateHome({ news: res.news });
                                                    alert("¡IA Generó nuevas noticias!");
                                                } else {
                                                    alert("Error de IA: " + res.error);
                                                }
                                            } catch (e: any) {
                                                alert("Error de conexión: " + e.message);
                                            } finally {
                                                setIsRefreshingNews(false);
                                            }
                                        }}
                                        disabled={isRefreshingNews}
                                        className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest px-4 py-2 border border-purple-500/20 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        <Sparkles size={14} className={isRefreshingNews ? "animate-spin" : ""} />
                                        Refrescar con IA
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const next = [...(home.news || []), { title: "Nueva Noticia", date: "HOY", summary: "", search_url: "", source: "DO Academy" }];
                                            updateHome({ news: next });
                                        }}
                                        className="text-[#cde641] text-[10px] font-black uppercase tracking-widest px-4 py-2 border border-[#cde641]/20 rounded-lg hover:bg-[#cde641]/10"
                                    >
                                        + Añadir Manual
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(home.news || []).map((n: any, idx: number) => (
                                    <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4 relative group hover:border-[#cde641]/20 transition-all">
                                        <button 
                                            onClick={() => {
                                                const next = home.news.filter((_: any, i: number) => i !== idx);
                                                updateHome({ news: next });
                                            }}
                                            className="absolute top-4 right-4 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <X size={16} />
                                        </button>

                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-white/20 uppercase tracking-widest">Título de Noticia</label>
                                            <input 
                                                className="w-full bg-black/60 border border-white/5 rounded-lg p-2 text-sm text-white focus:border-[#cde641]/40 outline-none"
                                                value={n.title}
                                                onChange={(e) => {
                                                    const next = [...home.news];
                                                    next[idx] = { ...n, title: e.target.value };
                                                    updateHome({ news: next });
                                                }}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-white/20 uppercase tracking-widest">Resumen / Descripción Corta</label>
                                            <textarea 
                                                className="w-full bg-black/60 border border-white/5 rounded-lg p-2 text-xs text-white/60 h-20 focus:border-[#cde641]/40 outline-none"
                                                value={n.summary || ''}
                                                onChange={(e) => {
                                                    const next = [...home.news];
                                                    next[idx] = { ...n, summary: e.target.value };
                                                    updateHome({ news: next });
                                                }}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest">Fecha/Tag</label>
                                                <input 
                                                    className="w-full bg-black/60 border border-white/5 rounded-lg p-2 text-xs text-white"
                                                    value={n.date}
                                                    onChange={(e) => {
                                                        const next = [...home.news];
                                                        next[idx] = { ...n, date: e.target.value };
                                                        updateHome({ news: next });
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest">Fuente (Web)</label>
                                                <input 
                                                    className="w-full bg-black/60 border border-white/5 rounded-lg p-2 text-xs text-white"
                                                    value={n.source || ''}
                                                    onChange={(e) => {
                                                        const next = [...home.news];
                                                        next[idx] = { ...n, source: e.target.value };
                                                        updateHome({ news: next });
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1 pt-2">
                                            <label className="text-[9px] font-black text-[#cde641] uppercase tracking-widest">URL Directa (EL ENLACE REAL)</label>
                                            <input 
                                                className="w-full bg-[#cde641]/5 border border-[#cde641]/20 rounded-lg p-3 text-[10px] text-[#cde641] font-mono"
                                                placeholder="https://..."
                                                value={n.search_url || ''}
                                                onChange={(e) => {
                                                    const next = [...home.news];
                                                    next[idx] = { ...n, search_url: e.target.value };
                                                    updateHome({ news: next });
                                                }}
                                            />
                                            <p className="text-[8px] text-white/20 italic">Debe empezar por https:// para que funcione en el Home.</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-8 border-t border-white/5">
                        <button
                            onClick={() => handleSave("home", home)}
                            disabled={isSaving}
                            className="bg-[#cde641] hover:shadow-[0_0_30px_rgba(205,230,65,0.3)] disabled:opacity-50 text-black font-black py-4 px-10 rounded-2xl transition-all flex items-center gap-3 uppercase italic tracking-tighter"
                        >
                            <Save size={18} />
                            {isSaving ? "Guardando..." : "PUBLICAR CAMBIOS"}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === "system" && (
                <div className="glass-effect rounded-3xl border border-red-500/20 p-8 space-y-6 animate-in fade-in">
                    <div className="flex items-center gap-3 pb-6 border-b border-white/5">
                        <Cpu className="text-red-400" />
                        <h2 className="text-xl font-bold text-white">Mantenimiento & IA</h2>
                    </div>
                    <div className="p-6 bg-black/20 rounded-2xl border border-white/5 space-y-4">
                        <p className="text-sm text-white/50">Forzar calificación inmediata de todas las entregas pendientes de alumnos usando la IA.</p>
                        <button onClick={handleManualGrading} disabled={isGrading} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                             {isGrading ? <Loader2 className="animate-spin" /> : <Cpu size={18} />}
                             Calificar Pendientes Ahora
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
