"use client";

import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Cell,
    PieChart,
    Pie,
    Legend,
} from "recharts";
import {
    ArrowLeft,
    TrendingUp,
    Users,
    Award,
    BarChart3,
    PieChart as PieChartIcon,
    Calendar,
    CheckCircle2,
} from "lucide-react";
import Link from "next/link";

interface AnalyticsData {
    courseTitle: string;
    overallAverage: number;
    totalStudents: number;
    deliveryPerformance: {
        name: string;
        fullName: string;
        average: number;
        submissions: number;
        graded: number;
        type: string;
    }[];
    categoryStats: {
        category: string;
        label: string;
        average: number;
        weight: number;
        count: number;
    }[];
}

interface CourseAnalyticsClientProps {
    courseId: string;
    data: AnalyticsData;
}

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];

export default function CourseAnalyticsClient({
    courseId,
    data,
}: CourseAnalyticsClientProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Link
                        href={`/admin/courses/${courseId}`}
                        className="inline-flex items-center gap-2 text-xs text-[var(--color-primary)] hover:text-white transition-colors mb-3 font-black uppercase tracking-widest"
                    >
                        <ArrowLeft size={14} /> Volver al Editor
                    </Link>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <BarChart3 className="text-[var(--color-primary)]" />
                        Análisis: {data.courseTitle}
                    </h1>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Promedio General"
                    value={`${data.overallAverage}%`}
                    icon={<Award className="text-blue-400" />}
                    subtitle="Nota media de entregas"
                    color="from-blue-500/20 to-blue-600/5"
                    borderColor="border-blue-500/20"
                />
                <StatCard
                    title="Estudiantes"
                    value={data.totalStudents.toString()}
                    icon={<Users className="text-emerald-400" />}
                    subtitle="Matriculados en el curso"
                    color="from-emerald-500/20 to-emerald-600/5"
                    borderColor="border-emerald-500/20"
                />
                <StatCard
                    title="Entregas"
                    value={data.deliveryPerformance.reduce((acc, d) => acc + d.submissions, 0).toString()}
                    icon={<CheckCircle2 className="text-purple-400" />}
                    subtitle="Total de archivos enviados"
                    color="from-purple-500/20 to-purple-600/5"
                    borderColor="border-purple-500/20"
                />
                <StatCard
                    title="Días de Evaluación"
                    value={data.deliveryPerformance.length.toString()}
                    icon={<Calendar className="text-amber-400" />}
                    subtitle="Hitos calificables activos"
                    color="from-amber-500/20 to-amber-600/5"
                    borderColor="border-amber-500/20"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Performance Chart */}
                <div className="lg:col-span-2 glass-effect p-8 rounded-3xl border border-white/5 bg-[var(--card-bg)] shadow-xl space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                            <TrendingUp size={20} className="text-blue-400" />
                            Curva de Rendimiento
                        </h3>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                            Nota promedio por hito
                        </span>
                    </div>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.deliveryPerformance}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                                <XAxis 
                                    dataKey="name" 
                                    stroke="#64748b" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis 
                                    stroke="#64748b" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false}
                                    domain={[0, 100]}
                                    tickFormatter={(val) => `${val}%`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="average"
                                    stroke="var(--color-primary)"
                                    strokeWidth={4}
                                    dot={{ r: 6, fill: "var(--color-primary)", strokeWidth: 2, stroke: "#1e293b" }}
                                    activeDot={{ r: 8, strokeWidth: 0 }}
                                    animationDuration={1500}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="glass-effect p-8 rounded-3xl border border-white/5 bg-[var(--card-bg)] shadow-xl space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                            <PieChartIcon size={20} className="text-purple-400" />
                            Desglose por Rubro
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.categoryStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="average"
                                    nameKey="label"
                                    animationDuration={1500}
                                >
                                    {data.categoryStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" strokeWidth={2} />
                                    ))}
                                </Pie>
                                <Tooltip content={<PieTooltip />} />
                                <Legend 
                                    verticalAlign="bottom" 
                                    iconType="circle" 
                                    formatter={(value) => <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-4 pt-4 border-t border-white/5">
                        {data.categoryStats.map((cat, idx) => (
                            <div key={cat.category} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                    <span className="text-sm font-bold text-slate-300">{cat.label}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-slate-500">{cat.weight}% peso</span>
                                    <span className="text-sm font-black text-white">{cat.average}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Participation Chart */}
            <div className="glass-effect p-8 rounded-3xl border border-white/5 bg-[var(--card-bg)] shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <CheckCircle2 size={20} className="text-emerald-400" />
                        Participación y Entregas
                    </h3>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.deliveryPerformance}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                            <XAxis 
                                dataKey="name" 
                                stroke="#64748b" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false}
                            />
                            <YAxis 
                                stroke="#64748b" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false}
                            />
                            <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                            <Bar 
                                dataKey="submissions" 
                                fill="#10b981" 
                                radius={[6, 6, 0, 0]}
                                barSize={40}
                                animationDuration={1500}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, subtitle, color, borderColor }: any) {
    return (
        <div className={`p-6 rounded-3xl border ${borderColor} bg-gradient-to-br ${color} backdrop-blur-xl shadow-lg relative overflow-hidden group`}>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform duration-500">
                        {icon}
                    </div>
                </div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{title}</h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white tracking-tight">{value}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-wider">{subtitle}</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-1000">
                {React.cloneElement(icon, { size: 100 })}
            </div>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-effect p-4 border border-white/10 rounded-2xl shadow-2xl bg-slate-900/90 backdrop-blur-md">
                <p className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-[0.2em] mb-2">{label}</p>
                <div className="space-y-1">
                    <p className="text-xl font-black text-white">{payload[0].value}%</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Promedio Estudiantil</p>
                </div>
            </div>
        );
    }
    return null;
};

const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-effect p-4 border border-white/10 rounded-2xl shadow-2xl bg-slate-900/90 backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: payload[0].fill }}>
                    {payload[0].name}
                </p>
                <p className="text-xl font-black text-white">{payload[0].value}%</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                    Nota media en esta categoría
                </p>
            </div>
        );
    }
    return null;
};

const BarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-effect p-4 border border-white/10 rounded-2xl shadow-2xl bg-slate-900/90 backdrop-blur-md">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">{label}</p>
                <div className="space-y-1">
                    <p className="text-xl font-black text-white">{payload[0].value} entregas</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Participación total</p>
                </div>
            </div>
        );
    }
    return null;
};
