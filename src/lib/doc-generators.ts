import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { jsPDF } from "jspdf";

export interface GradingResult {
    nota: number;
    comentario: string;
    feedback_positivo: string | string[];
    mejoras: string | string[];
}

export const generateDocx = async (result: GradingResult, studentName: string) => {
    const positives = Array.isArray(result.feedback_positivo) ? result.feedback_positivo : [result.feedback_positivo].filter(Boolean);
    const improvements = Array.isArray(result.mejoras) ? result.mejoras : [result.mejoras].filter(Boolean);

    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Evaluación de Tarea", bold: true, size: 48 })
                        ],
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: studentName ? `Estudiante: ${studentName}` : "Estudiante: N/A", size: 28 })
                        ],
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({ text: "" }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: `Calificación: `, bold: true, size: 36 }),
                            new TextRun({ text: `${result.nota !== null ? result.nota : "N/A"}/100`, size: 36, color: "2563eb" })
                        ],
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({ text: "" }),
                    new Paragraph({
                        children: [new TextRun({ text: "Comentarios Generales", bold: true, size: 32 })],
                        heading: HeadingLevel.HEADING_2,
                    }),
                    new Paragraph({ text: result.comentario || "Sin comentarios." }),
                    new Paragraph({ text: "" }),
                    new Paragraph({
                        children: [new TextRun({ text: "Aspectos Positivos", bold: true, size: 32 })],
                        heading: HeadingLevel.HEADING_2,
                    }),
                    ...(positives.length > 0 ? positives.map((p: string) => new Paragraph({ text: `• ${p}`, bullet: { level: 0 } })) : [new Paragraph({ text: "No especificado." })]),
                    new Paragraph({ text: "" }),
                    new Paragraph({
                        children: [new TextRun({ text: "Aspectos de Mejora", bold: true, size: 32 })],
                        heading: HeadingLevel.HEADING_2,
                    }),
                    ...(improvements.length > 0 ? improvements.map((p: string) => new Paragraph({ text: `• ${p}`, bullet: { level: 0 } })) : [new Paragraph({ text: "No especificado." })]),
                ],
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = studentName ? studentName.replace(/\s+/g, "_") : "estudiante";
    a.download = `Retroalimentacion_${safeName}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const generatePdf = (result: GradingResult, studentName: string) => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 30;

    // Title
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Evaluación de Tarea", 105, y, { align: "center" });
    y += 15;

    // Student identity
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(`Estudiante: ${studentName || "N/A"}`, 105, y, { align: "center" });
    y += 15;

    // Score
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235); // Blue
    doc.text(`Calificación: ${result.nota}/100`, 105, y, { align: "center" });
    y += 20;

    doc.setTextColor(0, 0, 0); // Black

    // General Comments
    doc.setFontSize(16);
    doc.text("Comentarios Generales", margin, y);
    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const splitComment = doc.splitTextToSize(result.comentario || "Sin comentarios.", 170);
    doc.text(splitComment, margin, y);
    y += (splitComment.length * 7) + 10;

    // Positives
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Aspectos Positivos", margin, y);
    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const positives = Array.isArray(result.feedback_positivo) ? result.feedback_positivo : [result.feedback_positivo].filter(Boolean);
    if (positives.length > 0) {
        positives.forEach(p => {
            const splitP = doc.splitTextToSize(`• ${p}`, 170);
            if (y + (splitP.length * 7) > 280) { doc.addPage(); y = 20; }
            doc.text(splitP, margin, y);
            y += (splitP.length * 7) + 2;
        });
    } else {
        doc.text("No especificado.", margin, y);
        y += 10;
    }
    y += 10;

    // Improvements
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Aspectos de Mejora", margin, y);
    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const improvements = Array.isArray(result.mejoras) ? result.mejoras : [result.mejoras].filter(Boolean);
    if (improvements.length > 0) {
        improvements.forEach(p => {
            const splitI = doc.splitTextToSize(`• ${p}`, 170);
            if (y + (splitI.length * 7) > 280) { doc.addPage(); y = 20; }
            doc.text(splitI, margin, y);
            y += (splitI.length * 7) + 2;
        });
    } else {
        doc.text("No especificado.", margin, y);
        y += 10;
    }

    const safeName = studentName ? studentName.replace(/\s+/g, "_") : "estudiante";
    doc.save(`Retroalimentacion_${safeName}.pdf`);
};
