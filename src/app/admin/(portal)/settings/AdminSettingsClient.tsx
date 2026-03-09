"use client";

import { useState, useRef } from "react";
import { updateSiteConfig } from "@/actions/admin-settings";
import { Save, User, Home, Share2, Award, Mail, MessageCircle, X, Github, Linkedin, Twitter, Instagram, Link as LinkIcon, Info } from "lucide-react";

export default function AdminSettingsClient({ initialConfigs }: { initialConfigs: any }) {
    const [configs, setConfigs] = useState(initialConfigs);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("home");
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const home = Object.keys(configs.home || {}).length > 0 ? configs.home : {
        heroTitle: "Domina la Tecnología con DO Academy",
        heroSubtitle: "Accede a contenido exclusivo diseñado por expertos para llevar tus habilidades al siguiente nivel profesional.",
        heroButtonText: "Empezar Ahora",
        heroButtonLink: "/register"
    };

    const about = Object.keys(configs.about || {}).length > 0 ? configs.about : {
        name: "Diego Orozco",
        title: "Creador de Experiencias Digitales & Mentor Tech",
        bio: "Apasionado por la educación y el desarrollo de software. He dedicado los últimos años a construir plataformas que ayudan a miles de estudiantes a dominar nuevas tecnologías.\n\nEn DO Academy, mi misión es democratizar el acceso al conocimiento técnico de alta calidad, creando no solo cursos, sino experiencias de aprendizaje que transformen carreras.",
        stats: [
            { label: "Años Exp.", value: "8+" },
            { label: "Cursos", value: "12" },
            { label: "Estudiantes", value: "5k+" },
            { label: "Cafés/Día", value: "3" }
        ],
        socialLinks: [
            { platform: "GitHub", url: "#" },
            { platform: "LinkedIn", url: "#" }
        ],
        contacts: [
            { type: "Email", value: "diego@doacademy.com" },
            { type: "WhatsApp", value: "#" }
        ]
    };


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
            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 w-full sm:w-fit overflow-x-auto custom-scrollbar">
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
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Biografía (Markdown)</label>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold bg-white/5 px-2 py-1 rounded">
                                <Info size={12} />
                                Soporta **negrita**, *cursiva*, # títulos y - listas
                            </div>
                        </div>
                        <textarea
                            value={about.bio || (about.bioParagraphs || []).join("\n\n")}
                            onChange={(e) => updateAbout({ bio: e.target.value })}
                            placeholder="Escribe tu biografía aquí usando Markdown..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all min-h-[300px] font-mono text-sm leading-relaxed"
                        />
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
                                        <button
                                            onClick={() => {
                                                const next = about.stats.filter((_: any, idx: number) => idx !== i);
                                                updateAbout({ stats: next });
                                            }}
                                            className="ml-auto text-red-500 hover:text-red-400 text-[10px] uppercase font-bold"
                                        >
                                            Quitar
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    const next = [...(about.stats || []), { label: "", value: "" }];
                                    updateAbout({ stats: next });
                                }}
                                className="w-full py-2 border border-dashed border-white/10 rounded-lg text-slate-500 hover:text-white hover:border-white/20 transition-all text-xs font-bold"
                            >
                                + Añadir Estadística
                            </button>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Share2 size={16} /> Redes Sociales
                            </h3>
                            <div className="space-y-3">
                                {(about.socialLinks || []).map((link: any, i: number) => (
                                    <div key={i} className="flex gap-2 items-end">
                                        <div className="flex-1 space-y-2">
                                            <select
                                                value={link.platform}
                                                onChange={(e) => {
                                                    const next = [...about.socialLinks];
                                                    next[i] = { ...link, platform: e.target.value };
                                                    updateAbout({ socialLinks: next });
                                                }}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-slate-400 uppercase font-black"
                                            >
                                                <option value="GitHub">GitHub</option>
                                                <option value="LinkedIn">LinkedIn</option>
                                                <option value="Twitter">Twitter (X)</option>
                                                <option value="Instagram">Instagram</option>
                                                <option value="Email">Email / Correo</option>
                                                <option value="Web">Sitio Web / Link</option>
                                            </select>
                                            <input
                                                value={link.url}
                                                placeholder={link.platform === "Email" ? "ej: hola@dominio.com" : "URL (https://...)"}
                                                onChange={(e) => {
                                                    const next = [...about.socialLinks];
                                                    next[i] = { ...link, url: e.target.value };
                                                    updateAbout({ socialLinks: next });
                                                }}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white"
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                const next = about.socialLinks.filter((_: any, idx: number) => idx !== i);
                                                updateAbout({ socialLinks: next });
                                            }}
                                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        const next = [...(about.socialLinks || []), { platform: "GitHub", url: "" }];
                                        updateAbout({ socialLinks: next });
                                    }}
                                    className="w-full py-2 border border-dashed border-white/10 rounded-lg text-slate-500 hover:text-white hover:border-white/20 transition-all text-xs font-bold"
                                >
                                    + Añadir Red Social
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Mail size={16} /> Métodos de Directos (Bio)
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
