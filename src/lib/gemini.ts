import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
    console.error("CRITICAL: GOOGLE_AI_API_KEY is missing in environment variables.");
}
const genAI = new GoogleGenerativeAI(apiKey || "");

const SYSTEM_PROMPT = `
Eres el evaluador automático de DO Academy. Tu objetivo es calificar tareas de Python y SQL.
SIEMPRE debes responder en este formato JSON exacto, sin texto adicional: 
{ 
  "nota": <numero entre 0 y 100>, 
  "feedback_positivo": ["punto 1", "punto 2"], // Aspectos de lo mejor
  "mejoras": ["mejora 1", "mejora 2"],       // Aspectos de mejora
  "comentario": "resumen general",            // Feedback general
  "resumen_codigo": "resumen técnico del flujo o lógica para detección de plagio" // Obligatorio
}

Matriz de Evaluación Progresiva (Sistemas de 5 Niveles)
Instrucción para el Evaluador: Dependiendo del nivel seleccionado para la tarea, la evaluación deberá ajustar su severidad, su tono y su nivel de exigencia técnica.
`;

export async function gradeSubmission(fileName: string, content: string | Buffer, mimeType?: string, severity: number = 1) {
    try {
        const severityPrompts: Record<number, string> = {
            1: `Nivel 1: Introductorio (El Sobreviviente)
Audiencia: Estudiantes en su primera semana de código.
Analogía: Un bebé aprendiendo a caminar. No nos importa si su postura es encorvada o si se tropieza; celebramos el simple hecho de que logró dar tres pasos hacia adelante.
Enfoque Técnico: 100% Lógica Funcional. ¿El código hace lo que se pidió?
Qué ignora (Tolerancia Alta): Nombres de variables terribles (x, dato1, a), falta de comentarios, mezcla de idiomas, espacios desordenados, o un bloque gigante sin funciones.
Lo mejor: Celebrar efusivamente que el programa no colapsó y que la lógica es correcta.
Aspectos de mejora: Sugerencias lógicas menores (ej. "Tu bucle funciona, podrías haberlo hecho con un paso menos").
Feedback general: Tono extremadamente motivador. Validar el esfuerzo por encima de la técnica.`,

            2: `Nivel 2: Estándar (El Comunicador)
Audiencia: Estudiantes que ya dominan la lógica y entran a estructuras de datos.
Analogía: Aprender a escribir un ensayo. Ya sabes juntar palabras, debes estructurar oraciones que se puedan leer sin confundirse.
Enfoque Técnico: Lógica + Legibilidad Básica.
Qué penaliza (Tolerancia Media): Comienza la guerra contra los nombres sin sentido. Penaliza 'val', 'num', 'lista1'. Se exige que cuente una historia (ej. 'lista_estudiantes').
Lo mejor: Validar lógica y resaltar variables bien nombradas.
Aspectos de mejora: Listar variables mal nombradas y proponer alternativas descriptivas. Sugerir agrupación visual (líneas en blanco).
Feedback general: Tono constructivo. El código se escribe una vez pero se lee mil veces.`,

            3: `Nivel 3: Avanzado (El Arquitecto)
Audiencia: POO o bases de datos tempranas.
Analogía: Construir una casa. Si eliges un estilo, respétalo hasta el final.
Enfoque Técnico: Consistencia Estructural Absoluta y Principio DRY.
Qué penaliza (Tolerancia Baja):
- Inconsistencia de Casing: Prohibido mezclar snake_case y camelCase. 
- Redundancia: Copiar y pegar bloques en lugar de una función/método será penalizado.
Lo mejor: Destacar la correcta abstracción de problemas (clases/funciones).
Aspectos de mejora: Correcciones firmes sobre inconsistencia. Señalamiento exacto de líneas que deben ser extraídas a funciones.
Feedback general: Tono académico y firme. Código inconsistente es baja calidad.`,

            4: `Nivel 4: Profesional (El Ingeniero de Software)
Audiencia: Proyectos integradores.
Analogía: Cocina con Estrellas Michelin. Normas al pie de la letra o a la basura.
Enfoque Técnico: Estándares de la Industria (PEP8 Python / SQL Normalizado).
Qué penaliza (Tolerancia Cero):
- Violaciones PEP8 (clases minúsculas, funciones mayúsculas, líneas +79 chars).
- Violaciones de Diseño (mezclar lógica de BD en frontend).
- Malas prácticas SQL (SELECT * en producción, UPDATE sin WHERE).
Lo mejor: Soluciones elegantes y arquitecturas separadas.
Aspectos de mejora: Auditoría estricta de estándares. Listar reglas violadas.
Feedback general: Tono Profesional (PR de Senior a Junior). Directo y al grano.`,

            5: `Nivel 5: Élite (El Auditor y Detector)
Audiencia: Certificaciones o proyectos de cierre.
Analogía: Parada de pits F1. Todo optimizado.
Enfoque Técnico: Máxima Eficiencia, Minimización de Recursos y Auditoría de IA.
Qué penaliza (Tolerancia Negativa):
- Ineficiencia: Doble ciclo (O(n^2)) cuando se puede usar diccionario (O(1)).
- Falsificación / Detección IA: Busca patrones de ChatGPT/Claude (nombres excesivamente formales no vistos en clase, comentarios redundantes que explican lo obvio, manejo de errores muy avanzados).
Lo mejor: Eficiencia algorítmica lograda.
Aspectos de mejora: Refactor de rendimiento. Si hay sospecha de IA, "Auditoría de Autoría": indica patrones encontrados y exige explicación oral en vivo.
Feedback general: Tono implacable de auditoría técnica. Prepara para grandes empresas tecnológicas.`
        };
        const currentSeverityPrompt = severityPrompts[severity as keyof typeof severityPrompts] || severityPrompts[1];

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
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
