const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
async function run() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_AI_API_KEY}`);
        const data = await response.json();
        const models = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent")).map(m => m.name);
        console.log(models.join("\n"));
    } catch(e) {
        console.error(e);
    }
}
run();
