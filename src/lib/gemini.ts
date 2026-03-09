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

export async function gradeSubmission(
    fileName: string,
    content: string | Buffer,
    mimeType?: string,
    severity: number = 1,
    instructions?: string
) {
    try {
        const severityPrompts: Record<number, string> = {
            0: `Nivel 0: Práctica Sin Puntaje (Feedback Formativo)
Audiencia: Ejercicios de calentamiento, entregas prácticas sin valor en la calificación.
Enfoque Técnico: Ayuda y mejora constructiva sin asociar a ninguna rúbrica estricta.
Instrucción Principal: No evalúes con severidad ni asocies el código a estándares rígidos. Únicamente revisa la lógica general y dale consejos amables.
La nota final siempre será 'null'.
Lo mejor: Felicitar el intento y la práctica libre.
Aspectos de mejora: Dar tips generales de estructura.
Feedback general: Completamente amigable y de apoyo enfocándose en el aprendizaje, no en la nota. RECORDATORIO: "nota" DEBE SER null.`,

            1: `Nivel 1: Fundamentos Estrictos de Buenas Prácticas
Audiencia: Estudiantes que están formando sus cimientos en programación.
Enfoque Técnico: Sintaxis Impecable y Nomenclatura Significativa.
Instrucción Principal: En este nivel, la lógica funcional no es suficiente. Se exige adherencia estricta a las buenas prácticas de escritura algorítmica.
Qué penaliza fuertemente: 
- Nombres de variables inservibles (a, b, dato, var1, x). DEBEN usar nombres descriptivos.
- Mezclar convenciones de nombres (ej. usar camelCase y snake_case en el mismo archivo). Deben elegir una sola convención y respetarla.
- Mala sintaxis (indéntación caótica, falta de consistencia visual, espacios desordenados).
Lo mejor: Validar cuando el código se lee como un libro estructurado y la lógica sirve.
Aspectos de mejora: Destacar duramente sin piedad cada variable mal nombrada y cada falta de ortografía sintáctica.
Feedback general: Formativo y estricto respecto al formato. Recuérdales que "el código se escribe una vez, pero se lee mil veces".`,

            2: `Nivel 2: Intermedio Funcional
Audiencia: Estudiantes dominando estructuras de control básico.
Enfoque Técnico: Organización Lógica y Estructuras Fundamentales.
Qué penaliza: Código repetitivo sin uso de condicionales o ciclos adecuados. Penaliza si la lógica es absurdamente enredada pudiendo ser simple.
Lo mejor: Uso eficiente de ifs/fors y buenas estructuras.
Aspectos de mejora: Invitar a pensar en funciones para separar lógica repetida.
Feedback general: Equilibrado entre funcionamiento correcto y limpieza de código.`,

            3: `Nivel 3: El Estándar Académico
Audiencia: Entrando a programación intermedia y abstracciones.
Enfoque Técnico: Lógica correcta + Legibilidad Clara. Principio DRY (Don't Repeat Yourself).
Qué penaliza: Bloques copiados y pegados masivamente sin extracción a funciones/arquitectura decente.
Lo mejor: Buena partición del código, abstracción y legibilidad.
Aspectos de mejora: Refactor sugerido, modularidad.
Feedback general: Tono académico y justo.`,

            4: `Nivel 4: Calidad Profesional
Audiencia: Proyectos o fin de módulos difíciles.
Enfoque Técnico: Estándares de Industria (PEP8 limpio para Python / SQL Normalizado / DRY extremo).
Qué penaliza (Tolerancia Baja): Violación de PEP8, código espagueti, lógica ineficiente al leer bases de datos, manejo de errores inexistente o pobre.
Lo mejor: Código limpio, defendible en un equipo real.
Aspectos de mejora: Auditorías sobre ineficiencias y arquitectura.
Feedback general: Estilo Senior Dev en un Code Review. Fuerte escrutinio.`,

            5: `Nivel 5: Élite (El Auditor Implacable)
Audiencia: Exámenes finales certificatorios o Anti-plagio.
Enfoque Técnico: O(n) exacto, optimización matemática profunda, y confirmación de NO PLAGIO.
Qué penaliza (Tolerancia Negativa): Ineficiencia de memoria/CPU profunda (ej. usar listas anidadas en O(n^2) cuando un hashmap en O(1) resolvía todo). 
Detección de IA: Analiza minuciosamente si el código es sintético, usa librerías ultra avanzadas no enseñadas, o maneja errores excesivamente defensivos típicos de ChatGPT.
Lo mejor: Rendimiento de clase mundial y confirmación lógica de autoría humana.
Aspectos de mejora: Reducción brutal de ciclos. Si parece IA sin entenderlo, bajar calificación sustancialmente argumentando patrones sintéticos.
Feedback general: Implacable, puramente técnico y matemático.`
        };
        const currentSeverityPrompt = severityPrompts[severity as keyof typeof severityPrompts] || severityPrompts[0];

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: SYSTEM_PROMPT + "\nCRITERIO DE EVALUACIÓN ACTUAL:\n" + currentSeverityPrompt,
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        let prompt = `Archivo a evaluar: ${fileName}\nPor favor, califica la entrega del estudiante basándote en el nivel de exigencia indicado.`;

        if (instructions) {
            prompt += `\n\n=== INSTRUCCIONES DE LA TAREA / ENUNCIADO ===\n${instructions}\n=============================================\n\nPor favor, utiliza estrictamente este enunciado para evaluar si el estudiante cumplió con lo solicitado.\n`;
        }

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
