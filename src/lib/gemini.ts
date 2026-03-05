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
  "feedback_positivo": ["punto 1", "punto 2"], 
  "mejoras": ["mejora 1", "mejora 2"], 
  "comentario": "resumen general" 
}
`;

export async function gradeSubmission(fileName: string, content: string | Buffer, mimeType?: string, severity: number = 1) {
    try {
        const severityPrompts: Record<number, string> = {
            1: `NIVEL 1 (Introductorio - 100% lógica, motivación máxima):
- Filosofía: Evalúa si el problema se resuelve aunque el código esté "feo". Tolera variables malas, estilo desordenado, repetición y falta de modularidad.
- Tono: Corrige con actitud de "vas bien, ahora hagámoslo más claro" SIN penalizaciones fuertes en la nota.
- Exigencia: El código corre y la solución se aproxima a lo pedido. 
- Sugerencias (sin penalizar): Mejorar nombres de variables o evitar repetir bloques como un "siguiente paso". No busques detectar IA.`,

            2: `NIVEL 2 (Estándar - Lógica manda, pero forma criterio):
- Filosofía: La lógica es principal, pero la claridad importa. Da sugerencias concretas sobre nombres y orden.
- Exigencia: Solución correcta (casos principales). Variables mínimamente interpretables (sin 'x' o 'a' para cosas reales). Estructura básica observable.
- Penaliza (Leve): Nombres crípticos que impiden la lectura, repetición evidente (claro copy/paste) o números mágicos hardcodeados. 
- Sugerencias: Agrupar lógica en funciones, o advertir levemente si mezclan snake_case y camelCase.`,

            3: `NIVEL 3 (Avanzado - Exigencia de consistencia):
- Filosofía: Se enseña consistencia profesional. No se permite mezclar estilos.
- Exigencia: Lógica correcta + casos borde. CONVENCIÓN ÚNICA obligatoria (o snake_case o camelCase, NUNCA la mezcla). Indentación coherente. Uso de funciones estructuradas.
- Penaliza (Moderado): Mezcla de convenciones (esto es un error grave aquí), nombres inconsistentes, repetición de bloques o código spaghetti.
- IA: Empieza a revisar coherencia interna. Si sospechas de plantilla de IA sin justificación, menciónalo en las áreas de mejora.`,

            4: `NIVEL 4 (Profesional - Estándares industriales):
- Filosofía: Se evalúa mantenibilidad, escalabilidad y estándar. La lógica correcta es el piso, no el techo.
- Exigencia: Estilo alineado a estándares (ej. PEP8 para Python, SQL Normalizado). Modularidad real (Regla DRY). Separación de responsabilidades.
- Penaliza (Fuerte): Código repetido, funciones gigantes multipropósito, nombres vagos, SQL desordenado sin convenciones ni relaciones claras, o falta de manejo de errores básicos.
- IA: Revisa activamente "huellas" de IA (comentarios genéricos descriptivos, estructuras demasiado perfectas sin contexto del curso). Si es evidente, resta puntos por falta de autenticidad.`,

            5: `NIVEL 5 (Élite - Eficiencia, redundancia mínima y autenticidad):
- Filosofía: Evaluación de alto desempeño (estilo PR de producción o entrevista algorítmica técnica).
- Exigencia: Todo lo del Nivel 4, MÁS eficiencia (tiempo/espacio), complejidad controlada, y uso "elegante" del lenguaje.
- Penaliza (Muy fuerte): Ineficiencias evitables (loops anidados innecesarios, múltiples consultas), "perfección vacía" o código bonito sin lógica de borde probada.
- Protocolo IA: Sé implacable. Si el código parece 100% generado por GPT (comentarios típicos, variables de plantilla pura), asume que es IA. Penaliza severamente y pon como mejora requerir "Defensa Oral: explique por qué eligió esta estructura exacta de datos y no otra".`
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
