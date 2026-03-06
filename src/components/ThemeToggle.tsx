"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
    const [theme, setTheme] = useState<"dark" | "light">("dark");

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
        if (savedTheme) {
            setTheme(savedTheme);
            if (savedTheme === "light") {
                document.documentElement.classList.add("light");
            }
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);

        if (newTheme === "light") {
            document.documentElement.classList.add("light");
        } else {
            document.documentElement.classList.remove("light");
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center group"
            title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
            {theme === "dark" ? (
                <Sun size={20} className="group-hover:rotate-45 transition-transform duration-500" />
            ) : (
                <Moon size={20} className="group-hover:-rotate-12 transition-transform duration-500 text-blue-400" />
            )}
        </button>
    );
}
