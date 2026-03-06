"use client";

import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Play, Send, CheckCircle, XCircle, AlertCircle, Maximize2, Minimize2, Copy, Trash2, Cpu, Code, Lock, Loader2 } from "lucide-react";
import { submitCodingExercise } from "@/actions/submissions";
import Script from "next/script";

interface StudentCodeEditorProps {
    initialCode?: string;
    expectedOutput?: string;
    similarityThreshold?: number;
    enablePlagiarism?: boolean;
    onSuccess?: (grade: number) => void;
    dayId: string;
    userId: string;
}

declare global {
    interface Window {
        loadPyodide: any;
    }
}

export default function StudentCodeEditor({
    initialCode = "# Escribe aquí tu solución...",
    expectedOutput,
    similarityThreshold = 0.9,
    enablePlagiarism = false,
    onSuccess,
    dayId,
    userId,
}: StudentCodeEditorProps) {
    const [code, setCode] = useState(initialCode);
    const [output, setOutput] = useState("");
    const [isExecuting, setIsExecuting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ status: 'success' | 'error' | 'pending' | null, score: number | null }>({ status: null, score: null });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPyodideLoading, setIsPyodideLoading] = useState(true);
    const [pyodideError, setPyodideError] = useState<string | null>(null);

    const editorRef = useRef<any>(null);
    const pyodideRef = useRef<any>(null);

    // Load Pyodide
    useEffect(() => {
        async function initPyodide() {
            try {
                if (!window.loadPyodide) return;

                const pyodide = await window.loadPyodide({
                    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
                });

                pyodideRef.current = pyodide;
                // Pre-load standard libraries if needed
                setIsPyodideLoading(false);
            } catch (err: any) {
                console.error("Pyodide error:", err);
                setPyodideError("Error al cargar el motor de Python.");
                setIsPyodideLoading(false);
            }
        }

        // Wait for Script component to load window.loadPyodide
        const timer = setInterval(() => {
            if (window.loadPyodide && !pyodideRef.current) {
                initPyodide();
                clearInterval(timer);
            }
        }, 500);

        return () => clearInterval(timer);
    }, []);

    // Anti-Plagiarism logic
    useEffect(() => {
        if (!enablePlagiarism) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
                e.preventDefault();
                alert("El copiado y pegado está deshabilitado para este ejercicio.");
            }
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        const handlePaste = (e: ClipboardEvent) => {
            e.preventDefault();
            alert("Pegar está deshabilitado.");
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('paste', handlePaste);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('paste', handlePaste);
        };
    }, [enablePlagiarism]);

    const handleEditorDidMount = (editor: any) => {
        editorRef.current = editor;
    };

    const handleExecute = async () => {
        if (!pyodideRef.current) {
            setOutput("Espere a que el motor de Python se inicie...");
            return;
        }

        setIsExecuting(true);
        setOutput(""); // Clean output

        try {
            // Redirigir stdout
            let capturedOutput = "";
            pyodideRef.current.setStdout({
                batched: (text: string) => {
                    capturedOutput += text + "\n";
                    setOutput(prev => prev + text + "\n");
                }
            });

            await pyodideRef.current.runPythonAsync(code);

            if (!capturedOutput) {
                setOutput("> Código ejecutado sin salida.");
            }
        } catch (err: any) {
            setOutput(`> Error: ${err.message}`);
        } finally {
            setIsExecuting(false);
        }
    };

    const handleSubmit = async () => {
        if (!output && !isExecuting) {
            alert("Primero ejecuta el código para verificar la salida.");
            return;
        }

        setIsSubmitting(true);
        setResult({ status: 'pending', score: null });

        try {
            const cleanOutput = output.replace(/> /g, "").trim();
            const res = await submitCodingExercise({
                userId,
                dayId,
                code,
                output: cleanOutput
            });

            if (res.success && res.submission) {
                setResult({ status: 'success', score: res.similarity || 0 });
                if (onSuccess) onSuccess(res.similarity || 0);
            } else {
                setResult({ status: 'error', score: 0 });
            }
        } catch (e) {
            setResult({ status: 'error', score: 0 });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`flex flex-col h-full bg-[#0B0D11] border border-slate-700/30 rounded-2xl overflow-hidden shadow-2xl transition-all ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'relative min-h-[550px]'}`}>
            <Script
                src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"
                strategy="afterInteractive"
            />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#14181E] border-b border-slate-700/50">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Code size={18} className="text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-wide">Python IDE</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            {isPyodideLoading ? (
                                <Loader2 size={10} className="text-blue-400 animate-spin" />
                            ) : (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            )}
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                {isPyodideLoading ? "Iniciando Python 3.10..." : "Motor Python Activo • Real Runtime"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                    <div className="h-6 w-[1px] bg-slate-700/50 mx-1"></div>
                    <button
                        onClick={handleExecute}
                        disabled={isExecuting || isSubmitting || isPyodideLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700/50 active:scale-95 disabled:opacity-50"
                    >
                        <Play size={14} className={isExecuting ? "animate-pulse" : ""} />
                        Ejecutar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isExecuting || isSubmitting || isPyodideLoading}
                        className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary, #0066FF)] hover:brightness-110 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? "Subiendo..." : "Enviar Lab"}
                        <Send size={14} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row min-h-0">
                {/* Editor Area */}
                <div className="flex-1 min-h-[400px] relative border-r border-slate-700/30">
                    <Editor
                        height="100%"
                        defaultLanguage="python"
                        theme="vs-dark"
                        value={code}
                        onChange={(val) => setCode(val || "")}
                        onMount={handleEditorDidMount}
                        options={{
                            fontSize: 14,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 20 },
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            cursorBlinking: "expand",
                            lineNumbersMinChars: 3,
                            glyphMargin: false,
                            folding: true,
                            lineHeight: 24,
                        }}
                    />
                    {enablePlagiarism && (
                        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                            <Lock size={12} className="text-amber-500" />
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">No Copy enabled</span>
                        </div>
                    )}
                </div>

                {/* Console Area */}
                <div className="w-full md:w-80 flex flex-col bg-[#0B0D11]">
                    <div className="flex items-center justify-between px-4 py-3 bg-[#14181E] border-b border-slate-700/50">
                        <div className="flex items-center gap-2">
                            <Cpu size={14} className="text-blue-400" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consola de Salida Real</span>
                        </div>
                        <button onClick={() => setOutput("")} className="text-slate-500 hover:text-white">
                            <Trash2 size={12} />
                        </button>
                    </div>

                    <div className="flex-1 p-6 font-mono text-[13px] overflow-y-auto bg-black/20">
                        {!output && !result.status && (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale">
                                <AlertCircle size={32} className="mb-4 text-slate-500" />
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Presiona "Ejecutar" para ver la<br />salida de tu programa.
                                </p>
                            </div>
                        )}

                        {output && (
                            <div className="animate-in fade-in duration-300">
                                <pre className="text-blue-400 whitespace-pre-wrap">{output}</pre>
                            </div>
                        )}

                        {result.status && (
                            <div className={`mt-6 p-4 rounded-xl border animate-in slide-in-from-bottom-2 duration-500 ${result.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
                                }`}>
                                <div className="flex items-center gap-3 mb-2">
                                    {result.status === 'success' ? (
                                        <CheckCircle size={18} className="text-emerald-400" />
                                    ) : (
                                        <XCircle size={18} className="text-rose-400" />
                                    )}
                                    <span className={`text-xs font-bold uppercase tracking-widest ${result.status === 'success' ? 'text-emerald-400' : 'text-rose-400'
                                        }`}>
                                        {result.status === 'success' ? 'Laboratorio Superado' : 'Error en Validación'}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                                    {result.status === 'success'
                                        ? 'Tu código se ejecutó y la salida coincide con lo esperado.'
                                        : 'La salida de tu programa es diferente a lo esperado por el profesor.'}
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                                    <span className="text-[10px] font-medium text-slate-500">SIMILITUD</span>
                                    <span className={`text-xl font-black ${result.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {result.score}%
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer of console */}
                    <div className="p-4 bg-[#14181E]/50 border-t border-slate-700/30">
                        <div className="flex items-center justify-between mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <span>Estado del Motor</span>
                            <span className={isPyodideLoading ? "text-amber-500" : "text-emerald-500"}>
                                {isPyodideLoading ? "Cargando..." : "Listo"}
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ${isPyodideLoading ? 'bg-amber-500 w-1/2' : 'bg-emerald-500 w-full'}`}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
