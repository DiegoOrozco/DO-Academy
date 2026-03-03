import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

const SYSTEM_PROMPT = `
Eres el evaluador automático de DO Academy. Tu objetivo es calificar tareas de Python y SQL.
- Revisa lógica de negocio, normalización de BD y buenas prácticas (PEP8).
- No permitas valores derivados en tablas si pueden ser calculados.
- Devuelve la respuesta estrictamente en este formato JSON: 
{ "nota": num, "feedback_positivo": ["punto 1", "punto 2"], "mejoras": ["mejora 1", "mejora 2"], "comentario": "resumen general" }
`;

export async function gradeSubmission(fileName: string, content: string) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
        Archivo: ${fileName}
        Contenido a evaluar:
        ${content}
        `;

        const result = await model.generateContent([SYSTEM_PROMPT, prompt]);
        const response = await result.response;
        let text = response.text();

        console.log("Gemini Raw Response:", text);

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
