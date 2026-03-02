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
        const text = response.text();

        return JSON.parse(text);
    } catch (error) {
        console.error("Error grading with Gemini:", error);
        throw new Error("Failed to grade submission");
    }
}
