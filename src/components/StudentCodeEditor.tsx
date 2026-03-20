"use client";

import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Play, Send, CheckCircle, XCircle, AlertCircle, Maximize2, Minimize2, Copy, Trash2, Cpu, Code, Lock, Loader2, FileText } from "lucide-react";
import { submitCodingExercise } from "@/actions/submissions";

interface StudentCodeEditorProps {
    initialCode?: string;
    exerciseDescription?: string; // Keep this for now, but its rendering will be removed.
    testCases?: Array<{ input: string; output: string }>;
    similarityThreshold?: number;
    enablePlagiarism?: boolean;
    isLate?: boolean;
    onSuccess?: (grade: number) => void;
    dayId: string;
    userId: string;
}

const pyodideWorkerCode = `
importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodideReadyPromise;

async function load() {
  self.pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
  });
  self.postMessage({ type: "loaded" });
}
pyodideReadyPromise = load();

self.onmessage = async (event) => {
  await pyodideReadyPromise;
  const { id, code, testCases } = event.data;
  
  try {
      let allOutput = "";
      let generatedOutputs = [];

      const isValidationMode = testCases && testCases.length > 0;
      const casesToRun = isValidationMode ? testCases : [{ input: event.data.userInput || "", output: "" }];

      for (let i = 0; i < casesToRun.length; i++) {
          const tc = casesToRun[i];
          
          let capturedOutput = "";
          let stdinQueue = tc.input ? tc.input.split("\\n") : [];

          self.pyodide.runPython(\`
import sys
from pyodide.ffi import create_proxy

def js_write(text):
    import js
    js.self.onStdout(text)

sys.stdout.write = js_write
sys.stderr.write = js_write
          \`);

          self.onStdout = create_proxy((text) => {
              capturedOutput += text;
          });

          self.pyodide.setStdin({
              stdin: () => {
                  if (stdinQueue.length === 0) return undefined;
                  const val = stdinQueue.shift();
                  capturedOutput += val + "\n"; 
                  return val + "\n";
              }
          });

          try {
              const globals = self.pyodide.globals.get('dict')();
              await self.pyodide.runPythonAsync(code, { globals });
              globals.destroy();
              
              const actual = capturedOutput.trim();
              
              if (isValidationMode) {
                  const expected = tc.output ? tc.output.trim() : "";
                  const isMatch = actual === expected;
                  
                  allOutput += \`--- CASO DE PRUEBA \${i + 1}: \${isMatch ? "✅ PASÓ" : "❌ FALLÓ"} ---\\n\`;
                  if (!isMatch) {
                      allOutput += \`[Esperado]: \${expected || "(Vacio)"}\\n\`;
                      allOutput += \`[Obtenido]: \${actual || "(Sin salida)"}\\n\`;
                  } else {
                      allOutput += \`[Salida]: \${actual || "(Correcta)"}\\n\`;
                  }
                  allOutput += "\\n";
              } else {
                  allOutput += capturedOutput;
              }
              
              generatedOutputs.push(actual);
          } catch (err) {
              if (isValidationMode) {
                  allOutput += \`--- CASO DE PRUEBA \${i + 1}: ⚠️ ERROR ---\\n\`;
                  allOutput += \`[Error]: \${err.message}\\n\\n\`;
              } else {
                  allOutput += \`Error: \${err.message}\\n\`;
              }
              generatedOutputs.push(""); 
          }
      }

      self.postMessage({ type: "result", id, allOutput, generatedOutputs });
  } catch (error) {
      self.postMessage({ type: "error", id, error: error.message });
  }
};
`;

export default function StudentCodeEditor({
    initialCode = "# Escribe aquí tu solución...",
    exerciseDescription,
    testCases = [],
    similarityThreshold = 0.9,
    enablePlagiarism = false,
    isLate = false,
    onSuccess,
    dayId,
    userId,
}: StudentCodeEditorProps) {
    const [code, setCode] = useState(initialCode);
    const [output, setOutput] = useState("");
    const [outputsArray, setOutputsArray] = useState<string[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ status: 'success' | 'error' | 'pending' | null, score: number | null }>({ status: null, score: null });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPyodideLoading, setIsPyodideLoading] = useState(true);
    const [userInput, setUserInput] = useState("");
    const [activeTab, setActiveTab] = useState<'output' | 'input'>('output');

    const editorRef = useRef<any>(null);
    const workerRef = useRef<Worker | null>(null);
    const executionIdRef = useRef(0);

    // Autosave logic
    useEffect(() => {
        const savedCode = localStorage.getItem(`autosave-${dayId}-${userId}`);
        if (savedCode && savedCode !== initialCode) {
            setCode(savedCode);
        }
    }, [dayId, userId, initialCode]);

    useEffect(() => {
        if (code === initialCode) return;
        const timer = setTimeout(() => {
            localStorage.setItem(`autosave-${dayId}-${userId}`, code);
        }, 1000); // 1 second debounce
        return () => clearTimeout(timer);
    }, [code, dayId, userId, initialCode]);

    // Initialize Web Worker
    useEffect(() => {
        const blob = new Blob([pyodideWorkerCode], { type: "application/javascript" });
        const worker = new Worker(URL.createObjectURL(blob));
        workerRef.current = worker;

        worker.onmessage = (e) => {
            const { type, id, allOutput, generatedOutputs, error } = e.data;
            if (type === "loaded") {
                setIsPyodideLoading(false);
            } else if (type === "result" && id === executionIdRef.current) {
                setOutput(allOutput);
                setOutputsArray(generatedOutputs);
                setIsExecuting(false);
            } else if (type === "error" && id === executionIdRef.current) {
                setOutput(`> Error General: ${error}`);
                setIsExecuting(false);
            }
        };

        return () => {
            worker.terminate();
        };
    }, []);

    // Anti-Plagiarism logic - ALWAYS ENABLED as requested
    useEffect(() => {
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
    }, []);

    const handleEditorDidMount = (editor: any) => {
        editorRef.current = editor;
    };

    const handleExecute = (withTestCases: boolean = false) => {
        if (!workerRef.current || isPyodideLoading) {
            setOutput("Espere a que el motor de Python se inicie...");
            return;
        }

        setIsExecuting(true);
        setOutput("");
        setResult({ status: null, score: null });
        setOutputsArray([]);

        executionIdRef.current += 1;
        workerRef.current.postMessage({
            id: executionIdRef.current,
            code,
            testCases: withTestCases ? testCases : [],
            userInput: userInput
        });
        if (!withTestCases) setActiveTab('output');
    };

    const handleSubmit = async () => {
        if (outputsArray.length === 0 && !isExecuting) {
            alert("Primero ejecuta el código para correr los casos de prueba.");
            return;
        }

        setIsSubmitting(true);
        setResult({ status: 'pending', score: null });

        try {
            const res = await submitCodingExercise({
                userId,
                dayId,
                code,
                outputs: outputsArray
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
        <div className={`flex flex-col bg-[#0B0D11] border border-slate-700/30 rounded-2xl overflow-hidden shadow-2xl transition-all ${isFullscreen ? 'fixed inset-0 z-[9999] rounded-none' : 'relative h-[650px]'}`}>
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
                        onClick={() => handleExecute(false)}
                        disabled={isExecuting || isSubmitting || isPyodideLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700/50 active:scale-95 disabled:opacity-50"
                        title="Ejecuta tu código para ver la salida"
                    >
                        <Play size={14} className={isExecuting ? "animate-pulse" : ""} />
                        Correr Código
                    </button>

                    {testCases.length > 0 && (
                        <button
                            onClick={() => handleExecute(true)}
                            disabled={isExecuting || isSubmitting || isPyodideLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold transition-all border border-emerald-500/20 active:scale-95 disabled:opacity-50"
                            title="Prueba tu código con casos configurados"
                        >
                            <Cpu size={14} />
                            Validar Casos
                        </button>
                    )}

                    <div className="h-6 w-[1px] bg-slate-700/50 mx-1"></div>
                    <button
                        onClick={handleSubmit}
                        disabled={isExecuting || isSubmitting || isPyodideLoading || isLate}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 ${isLate
                                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                : "bg-[var(--color-primary, #0066FF)] hover:brightness-110 text-white"
                            }`}
                    >
                        {isSubmitting ? "Subiendo..." : isLate ? "Expirado" : "Enviar Lab"}
                        <Send size={14} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row min-h-0">
                {/* Editor Area */}
                <div className="flex-1 flex flex-col min-h-[400px] relative border-r border-slate-700/30 bg-[#0B0D11]">
                    <div className="flex-1 relative flex flex-col min-h-0">
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
                </div>

                {/* Console Area */}
                <div className="w-full md:w-80 flex flex-col bg-[#0B0D11]">
                    <div className="flex items-center px-1 bg-[#14181E] border-b border-slate-700/50">
                        <button 
                            onClick={() => setActiveTab('output')}
                            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'output' ? 'text-blue-400 bg-blue-500/5 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Cpu size={14} />
                            Salida
                        </button>
                        <button 
                            onClick={() => setActiveTab('input')}
                            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'input' ? 'text-amber-400 bg-amber-500/5 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <FileText size={14} />
                            Entrada
                        </button>
                        <button onClick={() => { setOutput(""); setOutputsArray([]); }} className="p-3 text-slate-500 hover:text-white transition-colors">
                            <Trash2 size={12} />
                        </button>
                    </div>

                    <div className="flex-1 font-mono text-[13px] bg-black/20 flex flex-col min-h-0">
                        {activeTab === 'output' ? (
                            <div className="flex-1 p-6 overflow-y-auto">
                                {!output && !result.status && (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale">
                                        <AlertCircle size={32} className="mb-4 text-slate-500" />
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Presiona "Correr Código" para ver la<br />salida de tu programa.
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
                        ) : (
                            <div className="flex-1 flex flex-col p-4 bg-slate-900/50 divide-y divide-slate-700/30">
                                <div className="pb-4">
                                    <div className="flex items-center gap-2 mb-3 text-amber-500/70">
                                        <FileText size={12} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Entrada de Usuario (input())</span>
                                    </div>
                                    <textarea
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        placeholder="Escribe aquí los datos que usará input(). Usa una línea por cada llamada a input()."
                                        className="w-full h-40 bg-black/40 border border-slate-700/50 rounded-lg p-3 text-slate-300 resize-none focus:outline-none focus:border-amber-500/30 font-mono text-xs leading-5"
                                    />
                                </div>
                                <div className="pt-4">
                                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                                        <p className="text-[10px] text-amber-500/60 leading-relaxed">
                                            💡 <span className="font-bold">¿Cómo usarlo?</span> Cada línea que escribas aquí simula una entrada de teclado para tu script. Si tu código pide nombre y edad, escribe el nombre en la línea 1 y la edad en la línea 2.
                                        </p>
                                    </div>
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
