"use client";

import React, { useState } from "react";

interface CoursePieChartProps {
    data: {
        LAB: number;
        QUIZ: number;
        FORUM: number;
        PROJECT: number;
    };
    weights: {
        LAB: number;
        QUIZ: number;
        FORUM: number;
        PROJECT: number;
    };
    size?: number;
}

export default function CoursePieChart({ data, weights, size = 160 }: CoursePieChartProps) {
    const [hovered, setHovered] = useState<string | null>(null);

    const categories = [
        { id: "LAB", label: "Labs", value: data.LAB, weight: weights.LAB, color: "#3B82F6" },
        { id: "QUIZ", label: "Quices", value: data.QUIZ, weight: weights.QUIZ, color: "#A855F7" },
        { id: "FORUM", label: "Foros", value: data.FORUM, weight: weights.FORUM, color: "#10B981" },
        { id: "PROJECT", label: "Proyectos", value: data.PROJECT, weight: weights.PROJECT, color: "#F59E0B" },
    ];

    const totalWeight = categories.reduce((acc, cat) => acc + cat.weight, 0);
    let currentAngle = 0;

    const allZero = categories.every(c => c.value === 0);

    if (totalWeight === 0) return (
        <div className="flex items-center justify-center p-4 text-slate-500 text-xs font-bold uppercase tracking-widest border border-white/5 rounded-2xl bg-white/5">
            Sin ponderación configurada
        </div>
    );

    if (allZero) return (
        <div className="flex flex-col sm:flex-row items-center gap-8">
            {/* Empty pie placeholder */}
            <div className="relative shrink-0" style={{ width: size, height: size }}>
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-20">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl mb-1">📊</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider leading-tight">Sin<br />entregas</span>
                </div>
            </div>
            {/* Empty legend */}
            <div className="grid grid-cols-1 gap-3 flex-grow min-w-[180px]">
                {categories.filter(c => c.weight > 0).map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 opacity-50">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{cat.label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-xs font-black text-slate-600">—</span>
                            <div className="ml-2 px-1.5 py-0.5 rounded bg-black/40 border border-white/5 text-[9px] font-black text-slate-600">
                                {cat.weight}%
                            </div>
                        </div>
                    </div>
                ))}
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest text-center mt-1">Aún no hay entregas calificadas</p>
            </div>
        </div>
    );

    const hoveredCat = categories.find(c => c.id === hovered);

    return (
        <div className="flex flex-col sm:flex-row items-center gap-10" role="img" aria-label="Gráfico de rendimiento por rúbrica">
            <div className="relative group/chart" style={{ width: size, height: size }}>
                <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full drop-shadow-2xl">
                    <title>Rendimiento por rúbrica: {categories.filter(c => c.weight > 0).map(c => `${c.label} ${Math.round(c.value)}/100`).join(', ')}</title>
                    {categories.map((cat) => {
                        if (cat.weight === 0) return null;

                        const angle = (cat.weight / totalWeight) * 360;
                        const x1 = 50 + 42 * Math.cos((currentAngle * Math.PI) / 180);
                        const y1 = 50 + 42 * Math.sin((currentAngle * Math.PI) / 180);

                        const startAngle = currentAngle;
                        currentAngle += angle;

                        const x2 = 50 + 42 * Math.cos((currentAngle * Math.PI) / 180);
                        const y2 = 50 + 42 * Math.sin((currentAngle * Math.PI) / 180);

                        const largeArc = angle > 180 ? 1 : 0;
                        const isHovered = hovered === cat.id;

                        // Performance-based opacity
                        const scoreOpacity = isHovered ? 1 : Math.max(0.3, cat.value / 100);

                        return (
                            <path
                                key={cat.id}
                                d={`M 50 50 L ${x1} ${y1} A 42 42 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                fill={cat.color}
                                fillOpacity={scoreOpacity}
                                stroke="rgba(255,255,255,0.05)"
                                strokeWidth={isHovered ? "1.5" : "0.5"}
                                className="transition-all duration-300 cursor-pointer origin-center"
                                style={{
                                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                    filter: isHovered ? `drop-shadow(0 0 8px ${cat.color}44)` : 'none'
                                }}
                                onMouseEnter={() => setHovered(cat.id)}
                                onMouseLeave={() => setHovered(null)}
                            />
                        );
                    })}
                </svg>

                {/* Center Circle Content */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 bg-[#0B0F1A] rounded-full border border-white/10 flex flex-col items-center justify-center shadow-2xl backdrop-blur-sm">
                        {hoveredCat ? (
                            <>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{hoveredCat.label}</span>
                                <span className="text-sm font-black text-white">{Math.round(hoveredCat.value)}</span>
                            </>
                        ) : (
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">RUBROS</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 flex-grow min-w-[180px]">
                {categories.map((cat) => (
                    <div
                        key={cat.id}
                        className={`flex items-center justify-between p-2 rounded-xl transition-all border ${hovered === cat.id ? 'bg-white/5 border-white/10' : 'bg-transparent border-transparent'}`}
                        onMouseEnter={() => setHovered(cat.id)}
                        onMouseLeave={() => setHovered(null)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: cat.color, boxShadow: `0 0 10px ${cat.color}66` }}></div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{cat.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">{Math.round(cat.value)}</span>
                            <span className="text-[9px] text-slate-600 font-bold">/100</span>
                            <div className="ml-2 px-1.5 py-0.5 rounded bg-black/40 border border-white/5 text-[9px] font-black text-[var(--color-primary)]">
                                {cat.weight}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
