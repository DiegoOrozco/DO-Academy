import { getSiteConfig } from "@/lib/config";
import Link from "next/link";
import {
    Github,
    Linkedin,
    Twitter,
    Instagram,
    Mail,
    MessageCircle,
    ArrowRight
} from "lucide-react";
import SocialLink from "@/components/SocialLink";
import { getStudent } from "@/lib/student-auth";

export default async function AboutPage() {
    const student = await getStudent();
    const aboutConfig = await getSiteConfig("about") || {
        name: "Diego Orozco",
        title: "Creador de Experiencias Digitales & Mentor Tech",
        bioParagraphs: [
            "Apasionado por la educación y el desarrollo de software. He dedicado los últimos años a construir plataformas que ayudan a miles de estudiantes a dominar nuevas tecnologías.",
            "En DO Academy, mi misión es democratizar el acceso al conocimiento técnico de alta calidad, creando no solo cursos, sino experiencias de aprendizaje que transformen carreras."
        ],
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
        contactEmail: "diego@doacademy.com",
        contactWhatsapp: "#"
    };

    return (
        <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[var(--color-primary)] opacity-[0.1] blur-[150px] rounded-full"></div>
                <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-blue-500 opacity-[0.05] blur-[150px] rounded-full"></div>
            </div>

            <div className="max-w-4xl mx-auto px-6 pt-32 pb-20 relative z-10">
                {/* Hero Section */}
                <div className="flex flex-col md:flex-row items-center gap-12 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-blue-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="w-48 h-48 md:w-64 md:h-64 rounded-full border-2 border-white/10 p-2 relative z-10 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
                            <img
                                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
                                alt={aboutConfig.name}
                                className="w-full h-full object-cover rounded-full grayscale hover:grayscale-0 transition-all duration-500"
                            />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
                            {aboutConfig.name?.split(" ")[0]} <span className="text-[var(--color-primary)]">{aboutConfig.name?.split(" ").slice(1).join(" ")}</span>
                        </h1>
                        <p className="text-xl md:text-2xl font-semibold text-slate-300 mb-6">
                            {aboutConfig.title}
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            {aboutConfig.socialLinks?.map((link: any, i: number) => {
                                let Icon = Github;
                                if (link.platform === "LinkedIn") Icon = Linkedin;
                                if (link.platform === "Twitter") Icon = Twitter;
                                if (link.platform === "Instagram") Icon = Instagram;

                                return <SocialLink key={i} href={link.url} icon={<Icon size={20} />} label={link.platform} />;
                            })}
                        </div>
                    </div>
                </div>

                {/* Bio Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    <div className="md:col-span-2 space-y-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-[var(--color-primary)] rounded-full"></div>
                            Mi Historia
                        </h2>
                        <div className="space-y-4 text-lg text-slate-400 leading-relaxed font-medium">
                            {aboutConfig.bioParagraphs?.map((p: string, i: number) => (
                                <p key={i}>{p}</p>
                            ))}
                        </div>
                    </div>

                    <div className="glass-effect rounded-3xl p-8 border border-white/10 flex flex-col justify-between group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all"></div>

                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">¿Hablamos?</h3>
                            <p className="text-slate-400 text-sm mb-8 font-medium">
                                Si tienes dudas sobre los cursos o quieres colaborar en algún proyecto, envíame un mensaje.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <a
                                href={`mailto:${aboutConfig.contactEmail}`}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/50 hover:bg-white/10 transition-all group/btn"
                            >
                                <div className="flex items-center gap-3">
                                    <Mail size={18} className="text-blue-400" />
                                    <span className="text-sm font-bold text-white">Email</span>
                                </div>
                                <ArrowRight size={16} className="text-slate-500 group-hover/btn:translate-x-1 transition-transform" />
                            </a>
                            <a
                                href={aboutConfig.contactWhatsapp}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/50 hover:bg-white/10 transition-all group/btn"
                            >
                                <div className="flex items-center gap-3">
                                    <MessageCircle size={18} className="text-emerald-400" />
                                    <span className="text-sm font-bold text-white">WhatsApp</span>
                                </div>
                                <ArrowRight size={16} className="text-slate-500 group-hover/btn:translate-x-1 transition-transform" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Values/Quick Facts */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {aboutConfig.stats?.map((stat: any, i: number) => (
                        <StatCard key={i} label={stat.label} value={stat.value} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value }: { label: string, value: string }) {
    return (
        <div className="glass-effect rounded-2xl p-6 text-center border border-white/5 hover:border-[var(--color-primary)] transition-colors">
            <div className="text-2xl font-black text-white mb-1">{value}</div>
            <div className="text-[10px] uppercase tracking-widest font-black text-slate-500">{label}</div>
        </div>
    );
}
