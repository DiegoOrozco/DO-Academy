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
            1: "NIVEL 1 (Introductorio): Enfócate puramente en que la lógica funcione. Sé muy alentador y motivador. Ignora errores menores de estilo o nombres de variables.",
            2: "NIVEL 2 (Estándar): Revisa la lógica y empieza a sugerir mejores nombres de variables si son muy genéricos (ej. 'a', 'val').",
            3: "NIVEL 3 (Avanzado): Exige CONSISTENCIA. No permitas mezcla de snake_case y camelCase en el mismo archivo. El estilo debe ser uniforme.",
            4: "NIVEL 4 (Profesional): Exige estándares industriales (PEP8 para Python, Normalización para SQL). Penaliza fuertemente el código repetido y la falta de modularización.",
            5: "NIVEL 5 (Élite): Máxima exigencia. Evalúa eficiencia algorítmica, redundancia mínima y detecta si el código parece generado por IA (patrones demasiado perfectos o comentarios genéricos de GPT). Sé extremadamente crítico."
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
