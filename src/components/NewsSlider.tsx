"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

interface NewsItem {
    title: string;
    summary: string;
    date: string;
    image_keyword?: string;
    search_url?: string;
    source?: string;
    grad?: string;
}

export default function NewsSlider({ news }: { news: NewsItem[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % news.length);
    }, [news.length]);

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + news.length) % news.length);
    };

    useEffect(() => {
        if (!isHovered) {
            const interval = setInterval(nextSlide, 5000);
            return () => clearInterval(interval);
        }
    }, [nextSlide, isHovered]);

    if (!news || news.length === 0) return null;

    const current = news[currentIndex];

    return (
        <div 
            className="group relative w-full aspect-[21/9] min-h-[400px] rounded-[50px] overflow-hidden shadow-2xl border border-white/5 transition-all duration-700"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background Image with Reveal Animation */}
            {news.map((item, i) => (
                <div 
                    key={i}
                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                        i === currentIndex ? "opacity-100 scale-105" : "opacity-0 scale-100"
                    }`}
                >
                    <Image 
                        src={`https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1600&sig=${encodeURIComponent(item.image_keyword || item.title || i)}`}
                        alt={item.title}
                        fill
                        className="object-cover"
                        priority={i === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent opacity-80" />
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.grad || 'from-blue-600/20 to-transparent'} opacity-30`} />
                </div>
            ))}

            {/* Content Box (Udemy/Coursera style) */}
            <div className="relative h-full flex items-center px-10 sm:px-20 z-10">
                <div 
                    className="bg-white/95 backdrop-blur-xl p-8 sm:p-12 rounded-[32px] max-w-[500px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] transform transition-all duration-700 translate-y-0 group-hover:-translate-y-2 animate-in fade-in slide-in-from-left-10"
                    key={`content-${currentIndex}`}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <span className="bg-[#cde641]/10 text-[#5a6a00] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#cde641]/30">
                            {current.source || 'Breaking News'}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{current.date}</span>
                    </div>
                    
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-[1.1] mb-6 tracking-tight">
                        {current.title}
                    </h2>
                    
                    <p className="text-gray-600 text-lg leading-relaxed mb-8">
                        {current.summary}
                    </p>

                    <Link 
                        href={current.search_url?.startsWith('http') ? current.search_url : `https://www.google.com/search?q=${encodeURIComponent(current.title)}+noticias+tech&tbm=nws`}
                        target="_blank"
                        className="inline-flex items-center gap-2 bg-[#cde641] text-black px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black hover:text-white transition-all transform active:scale-95 group/btn"
                    >
                        Buscar Noticia
                        <Search className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    </Link>
                </div>
            </div>

            {/* Navigation Arrows */}
            <button 
                onClick={(e) => { e.preventDefault(); prevSlide(); }}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 active:scale-90 z-20"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
                onClick={(e) => { e.preventDefault(); nextSlide(); }}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 active:scale-90 z-20"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-10 right-10 flex gap-3 z-20">
                {news.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`h-1.5 transition-all duration-500 rounded-full ${
                            i === currentIndex ? "w-10 bg-[#cde641]" : "w-4 bg-white/20 hover:bg-white/40"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}
