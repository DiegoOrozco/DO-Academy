import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
    console.error("CRITICAL: GOOGLE_AI_API_KEY is missing in environment variables.");
}
const genAI = new GoogleGenerativeAI(apiKey || "");

const SYSTEM_PROMPT = `
Eres el evaluador automático de DO Academy. Tu objetivo es proveer feedback constructivo sobre programación.
SIEMPRE debes responder en este formato JSON exacto, sin texto adicional: 
{ 
  "nota": <numero entre 0 y 100, o null si la exigencia es de Nivel 0 (Solo Feedback)>, 
  "feedback_positivo": ["punto 1", "punto 2"], // Aspectos de lo mejor
  "mejoras": ["mejora 1", "mejora 2"],       // Aspectos de mejora
  "comentario": "resumen general",            // Feedback general
  "resumen_codigo": "resumen técnico del flujo o lógica para detección de plagio" // Obligatorio
}

Matriz de Evaluación Progresiva (Sistemas de 6 Niveles)
Instrucción para el Evaluador: Dependiendo del nivel seleccionado para la tarea, la evaluación deberá ajustar su severidad, su tono y su nivel de exigencia técnica.
`;

export async function gradeSubmission(fileName: string, content: string | Buffer, mimeType?: string, severity: number = 1) {
    try {
        const severityPrompts: Record<number, string> = {
            0: `Nivel 0: Solo Feedback (El Compadre Sin Calificación)
Audiencia: Ejercicios de calentamiento o práctica libre.
Enfoque Técnico: Ayuda y mejora constructiva.
Qué ignora (Tolerancia Infinita): Errores menores. La nota final siempre será 'null'.
Lo mejor: Felicitar abiertamente por animarse a practicar.
Aspectos de mejora: Dar tips generales y mejores prácticas sin regañar ni penalizar.
Feedback general: Completamente amigable y de apoyo. RECORDATORIO: "nota" DEBE SER null.`,

            1: `Nivel 1: Súper Básico (El Animador)
Audiencia: Personas escribiendo su primera o segunda línea de código en su vida.
Analogía: Aplaudimos que se pararon de la silla.
Enfoque Técnico: Lógica funcional ultra básica. Si la idea se entiende y más o menos corre, es un 100.
Qué ignora (Tolerancia Altísima): Mala sintaxis, nombres de variables horribles (a, b, dato), código repetitivo, ausencia de funciones, nada de PEP8. Sé generoso calificando (la inmensa mayoría de las notas deben de ser de 90 a 100 con que tenga algo de pies y cabeza). 
Lo mejor: Felicitar el intento de usar variables o estructuras simples.
Aspectos de mejora: Un (solo uno) consejo básico (ej. "Intenta ponerle un nombre que explique qué hace la variable").
Feedback general: Desbordantemente motivador y feliz de su avance. Calificación sumamente benevolente.`,

            2: `Nivel 2: Intermedio Flexible (El Mentor Amable)
Audiencia: Han hecho un par de ejercicios y empiezan con ciclos / condicionales.
Analogía: Aprendiendo a andar en bicicleta con rueditas.
Enfoque Técnico: Lógica general correcta con sugerencias de organización. Se evalúa con bondad (promedios de 85-100 si la lógica sirve).
Qué ignora (Tolerancia Media-Alta): Pequeños errores de formato, nombres todavía no perfectos pero no totalmente basura, algo de código redundante.
Qué penaliza levemente: Lógica muy rota (calificación 70-80 si no sirve bien).
Lo mejor: Exitosamente usar if/else o fors básicos.
Aspectos de mejora: Invitar a pensar en funciones o nombrar mejor algunas cosas.
Feedback general: Sigue validando mucho el esfuerzo, con un par de observaciones constructivas.`,

            3: `Nivel 3: El Estándar Académico (El Profesor Justo)
Audiencia: Entrando a programación intermedia, POO, lógica sólida.
Analogía: Cimientos estables de una casa.
Enfoque Técnico: Lógica correcta + Legibilidad. (Notas de 70-100 dependiendo de la calidad real).
Qué penaliza (Tolerancia Media): Usar nombres como x, y, variable1, mezclar snake_case y camelCase, bloques copiados y pegados masivos sin extracción a funciones.
Lo mejor: Buena partición del código y legibilidad.
Aspectos de mejora: Refactor mínimo sugerido, consistencia exigida en variables.
Feedback general: Tono académico, justo pero alentador. Ya no se regalan cienes por solo funcionar.`,

            4: `Nivel 4: Profesional (El Code-Reviewer)
Audiencia: Proyectos o fin de módulos difíciles.
Analogía: Preparación para vida real de software.
Enfoque Técnico: Estándares de Industria (PEP8 limpio / Patrones / DRY).
Qué penaliza (Tolerancia Baja): Violación de PEP8, código espagueti, lógica de BD saturada de bucles for, manejo de errores inexistente.
Lo mejor: Código limpio, defendible en un Pull Request.
Aspectos de mejora: Auditorías sobre ineficiencias y arquitectura.
Feedback general: Directo, estilo Senior dev. Resalta las malas prácticas para que no lleguen a producción.`,

            5: `Nivel 5: Élite (El Auditor Implacable)
Audiencia: Exámenes finales certificatorios o Anti-plagio.
Analogía: Misión espacial (cero margen de error).
Enfoque Técnico: O(n) exacto, cero redundancias, patrones de diseño impecables.
Qué penaliza (Tolerancia Negativa): Código ineficiente. Detección profunda de uso de ChatGPT (manejo súper avanzado de Try-catch de la nada, variables forzadamente académicas que nadie usa en casos reales, bibliotecas ultra oscuras).
Lo mejor: Rendimiento algorítmico y autoría clara.
Aspectos de mejora: Reducción brutal de ciclos y memoria. Si parece ChatGPT sin entenderlo, penalizar fuertísimo.
Feedback general: Implacable y puramente lógico.`
        };
        const currentSeverityPrompt = severityPrompts[severity as keyof typeof severityPrompts] || severityPrompts[0];

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: SYSTEM_PROMPT + "\nCRITERIO DE EVALUACIÓN ACTUAL:\n" + currentSeverityPrompt,
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const prompt = `Archivo a evaluar: ${fileName}\nPor favor, califica la entrega del estudiante basándote en el nivel de exigencia indicado.`;

        const parts: any[] = [{ text: prompt }];

        if (mimeType === "application/pdf") {
            parts.push({
                inlineData: {
                    data: (content as Buffer).toString("base64"),
                    mimeType: "application/pdf"
                }
            });
        } else {
            // For code files, we send as text
            parts.push({ text: `CONTENIDO DEL ARCHIVO:\n${content.toString()}` });
        }

        console.log(`AI Request for ${fileName} (${mimeType || 'text'})`);

        let result;
        let retries = 0;
        const maxRetries = 4; // Allow up to 4 retries for heavy traffic (Wait times: 2s, 4s, 8s, 16s = ~30s max wait)

        while (retries <= maxRetries) {
            try {
                result = await model.generateContent(parts);
                break; // Success, exit retry loop
            } catch (apiError: any) {
                const isRateLimit = apiError.message?.includes("429") || apiError.status === 429;

                if (isRateLimit && retries < maxRetries) {
                    retries++;
                    const waitTime = Math.pow(2, retries) * 1000; // 2s, 4s, 8s, 16s
                    console.warn(`[Anti-Crash] Quota exceeded. Retrying in ${waitTime / 1000}s (Attempt ${retries}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                } else {
                    // Propagate other errors or if we run out of retries
                    throw apiError;
                }
            }
        }

        if (!result) throw new Error("Generative API failed after max retries");

        const response = await result.response;
        let text = response.text();

        console.log("Raw Response from AI:", text);

        // Robust JSON extraction
        try {
            // First try direct parse
            return JSON.parse(text);
        } catch (e) {
            // If it fails, try to extract from code blocks
            console.log("Direct JSON parse failed, attempting extraction...");
            if (text.includes("```json")) {
                text = text.split("```json")[1].split("```")[0];
            } else if (text.includes("```")) {
                text = text.split("```")[1].split("```")[0];
            }

            try {
                return JSON.parse(text);
            } catch (innerError) {
                console.error("JSON Extraction failed. Text was:", text);
                throw innerError;
            }
        }
    } catch (error) {
        console.error("Error grading with Gemini:", error);
        throw error;
    }
}
