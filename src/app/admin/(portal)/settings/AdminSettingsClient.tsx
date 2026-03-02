"use client";

import { useState, useRef } from "react";
import { updateSiteConfig } from "@/actions/admin-settings";
import { Save, User, Home, Share2, Award, Mail, MessageCircle, X } from "lucide-react";

export default function AdminSettingsClient({ initialConfigs }: { initialConfigs: any }) {
    const [configs, setConfigs] = useState(initialConfigs);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("home");
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const home = configs.home || {};
    const about = configs.about || {};

    const handleSave = async (key: string, value: any) => {
        setIsSaving(true);
        const res = await updateSiteConfig(key, value);
        setIsSaving(false);

        if (res.success) {
            alert("Configuración guardada correctamente.");
        } else {
            alert("Error al guardar: " + res.error);
        }
    };

    const updateHome = (updates: any) => {
        setConfigs((prev: any) => ({
            ...prev,
            home: { ...prev.home, ...updates }
        }));
    };

    const updateAbout = (updates: any) => {
        setConfigs((prev: any) => ({
            ...prev,
            about: { ...prev.about, ...updates }
        }));
    };

    return (
        <div className="space-y-8">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 w-fit">
                <TabButton
                    active={activeTab === "home"}
                    onClick={() => setActiveTab("home")}
                    icon={<Home size={18} />}
                    label="Inicio"
                />
                <TabButton
                    active={activeTab === "about"}
                    onClick={() => setActiveTab("about")}
                    icon={<User size={18} />}
                    label="Sobre Mí"
                />
            </div>

            {activeTab === "home" && (
                <div className="glass-effect rounded-3xl border border-white/10 p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3 pb-6 border-b border-white/5">
                        <Home className="text-[var(--color-primary)]" />
                        <h2 className="text-xl font-bold text-white">Configuración de Inicio</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <FormField
                            label="Título Hero"
                            value={home.heroTitle}
                            onChange={(v) => updateHome({ heroTitle: v })}
                        />
                        <FormField
                            label="Subtítulo Hero"
                            textarea
                            value={home.heroSubtitle}
                            onChange={(v) => updateHome({ heroSubtitle: v })}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                label="Texto Botón"
                                value={home.heroButtonText}
                                onChange={(v) => updateHome({ heroButtonText: v })}
                            />
                            <FormField
                                label="Enlace Botón"
                                value={home.heroButtonLink}
                                onChange={(v) => updateHome({ heroButtonLink: v })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={() => handleSave("home", home)}
                            disabled={isSaving}
                            className="bg-[var(--color-primary)] hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                        >
                            <Save size={18} />
                            {isSaving ? "Guardando..." : "Guardar Cambios de Inicio"}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === "about" && (
                <div className="glass-effect rounded-3xl border border-white/10 p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3 pb-6 border-b border-white/5">
                        <User className="text-[var(--color-primary)]" />
                        <h2 className="text-xl font-bold text-white">Configuración "Sobre Mí"</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            label="Nombre"
                            value={about.name}
                            onChange={(v) => updateAbout({ name: v })}
                        />
                        <FormField
                            label="Título Profesional"
                            value={about.title}
                            onChange={(v) => updateAbout({ title: v })}
                        />
                        <FormField
                            label="URL de Foto de Perfil"
                            value={about.imageUrl}
                            onChange={(v) => updateAbout({ imageUrl: v })}
                        />
                    </div>

                    {/* Uploader de imagen con optimización */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Subir Foto de Perfil</label>
                        <div className="flex items-center gap-4 flex-wrap">
                            {about.imageUrl && (
                                <img
                                    src={about.imageUrl}
                                    alt="Preview"
                                    className="w-20 h-20 rounded-full object-cover border border-white/10"
                                />
                            )}
                            <div className="flex items-center gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            const img = new Image();
                                            img.onload = () => {
                                                // Optimización de imagen usando Canvas
                                                const canvas = document.createElement("canvas");
                                                const MAX_WIDTH = 600;
                                                let width = img.width;
                                                let height = img.height;

                                                if (width > MAX_WIDTH) {
                                                    height *= MAX_WIDTH / width;
                                                    width = MAX_WIDTH;
                                                }

                                                canvas.width = width;
                                                canvas.height = height;
                                                const ctx = canvas.getContext("2d");
                                                ctx?.drawImage(img, 0, 0, width, height);

                                                // Comprimir a JPEG con calidad 0.7 para ahorrar espacio drásticamente
                                                const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
                                                updateAbout({ imageUrl: optimizedDataUrl });
                                            };
                                            img.src = event.target?.result as string;
                                        };
                                        reader.readAsDataURL(file);
                                    }}
                                />
                                <button
                                    type="button"
                                    className="bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-lg border border-white/10 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Optimizar y Seleccionar Imagen
                                </button>
                                {about.imageUrl && (
                                    <button
                                        type="button"
                                        className="text-red-400 hover:text-red-300 text-sm px-3 py-2 font-medium"
                                        onClick={() => updateAbout({ imageUrl: "" })}
                                    >
                                        Quitar
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">
                            La imagen se redimensionará y comprimirá automáticamente para un guardado instantáneo.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Biografía (Párrafos)</label>
                        {about.bioParagraphs?.map((p: string, i: number) => (
                            <textarea
                                key={i}
                                value={p}
                                onChange={(e) => {
                                    const next = [...about.bioParagraphs];
                                    next[i] = e.target.value;
                                    updateAbout({ bioParagraphs: next });
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all min-h-[100px]"
                            />
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Award size={16} /> Estadísticas
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                {about.stats?.map((s: any, i: number) => (
                                    <div key={i} className="space-y-2">
                                        <input
                                            value={s.label}
                                            placeholder="Label"
                                            onChange={(e) => {
                                                const next = [...about.stats];
                                                next[i] = { ...next[i], label: e.target.value };
                                                updateAbout({ stats: next });
                                            }}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-slate-400 font-bold"
                                        />
                                        <input
                                            value={s.value}
                                            placeholder="Valor"
                                            onChange={(e) => {
                                                const next = [...about.stats];
                                                next[i] = { ...next[i], value: e.target.value };
                                                updateAbout({ stats: next });
                                            }}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white font-bold"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Share2 size={16} /> Métodos de Contacto
                            </h3>
                            <div className="space-y-3">
                                {about.contacts?.map((c: any, i: number) => (
                                    <div key={i} className="flex gap-2 items-end">
                                        <div className="flex-1 space-y-2">
                                            <input
                                                value={c.type}
                                                placeholder="Tipo (Email, Telegram, etc.)"
                                                onChange={(e) => {
                                                    const next = [...about.contacts];
                                                    next[i] = { ...c, type: e.target.value };
                                                    updateAbout({ contacts: next });
                                                }}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-slate-400 uppercase font-bold"
                                            />
                                            <input
                                                value={c.value}
                                                placeholder="Enlace o Valor"
                                                onChange={(e) => {
                                                    const next = [...about.contacts];
                                                    next[i] = { ...c, value: e.target.value };
                                                    updateAbout({ contacts: next });
                                                }}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white"
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                const next = about.contacts.filter((_: any, idx: number) => idx !== i);
                                                updateAbout({ contacts: next });
                                            }}
                                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        const next = [...(about.contacts || []), { type: "Nuevo", value: "" }];
                                        updateAbout({ contacts: next });
                                    }}
                                    className="w-full py-2 border border-dashed border-white/10 rounded-lg text-slate-500 hover:text-white hover:border-white/20 transition-all text-xs font-bold"
                                >
                                    + Añadir Método de Contacto
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={() => handleSave("about", about)}
                            disabled={isSaving}
                            className="bg-[var(--color-primary)] hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                        >
                            <Save size={18} />
                            {isSaving ? "Guardando..." : "Guardar Cambios de Perfil"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 font-bold text-sm ${active
                ? "bg-[var(--color-primary)] text-white shadow-lg shadow-blue-500/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

function FormField({ label, value, onChange, textarea, small }: { label: string, value: string, onChange: (v: string) => void, textarea?: boolean, small?: boolean }) {
    return (
        <div className="space-y-2">
            <label className={`${small ? "text-[10px]" : "text-sm"} font-bold text-slate-400 uppercase tracking-widest`}>{label}</label>
            {textarea ? (
                <textarea
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all min-h-[120px]"
                />
            ) : (
                <input
                    type="text"
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                />
            )}
        </div>
    );
}
