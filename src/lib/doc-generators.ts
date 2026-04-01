import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, BorderStyle, ShadingType, WidthType } from "docx";
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

    // Dark Mode Colors
    const BG_COLOR = "0f172a";
    const CARD_BG = "1e293b";
    const TEXT_MAIN = "e5e7eb";
    const TEXT_MUTED = "94a3b8";
    const COLOR_SUCCESS = "22c55e";
    const COLOR_WARNING = "f59e0b";

    const createCard = (text: string, titleColor: string) => {
        const cleanText = text.replace(/^\*\*|^\*|^-/, '').trim();
        const parts = cleanText.split('**:');
        const title = parts.length > 1 ? parts[0] + ":" : "";
        const desc = parts.length > 1 ? parts.slice(1).join("**:").trim() : cleanText;

        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: CARD_BG },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: CARD_BG },
                left: { style: BorderStyle.SINGLE, size: 4, color: CARD_BG },
                right: { style: BorderStyle.SINGLE, size: 4, color: CARD_BG },
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            shading: { fill: CARD_BG },
                            margins: { top: 200, bottom: 200, left: 200, right: 200 },
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: "• ", color: titleColor, bold: true }),
                                        new TextRun({ text: title, color: TEXT_MAIN, bold: true }),
                                        new TextRun({ text: title ? ` ${desc}` : cleanText, color: TEXT_MUTED })
                                    ]
                                })
                            ]
                        })
                    ]
                })
            ]
        });
    };

    const doc = new Document({
        background: { color: BG_COLOR },
        sections: [
            {
                properties: {
                    page: {
                        margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 },
                    }
                },
                children: [
                    // Header Table
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }
                        },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [
                                            new Paragraph({ children: [new TextRun({ text: studentName || "Estudiante", color: TEXT_MAIN, bold: true, size: 36 })] }),
                                            new Paragraph({ children: [new TextRun({ text: "EVALUACIÓN | REPORTE AUTOMATIZADO CON IA", color: TEXT_MUTED, bold: true, size: 16 })] }),
                                        ]
                                    }),
                                    new TableCell({
                                        children: [
                                            new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${result.nota || "0"}/100`, color: COLOR_SUCCESS, bold: true, size: 42 })] }),
                                            new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "NOTA FINAL", color: TEXT_MUTED, size: 14 })] })
                                        ]
                                    })
                                ]
                            })
                        ]
                    }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    
                    // Comentario General
                    new Paragraph({ children: [new TextRun({ text: "COMENTARIO GENERAL", color: "a78bfa", bold: true, size: 20 })] }),
                    new Paragraph({ text: "" }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        shading: { fill: CARD_BG },
                                        margins: { top: 300, bottom: 300, left: 300, right: 300 },
                                        children: [
                                            new Paragraph({
                                                children: [new TextRun({ text: `"${result.comentario || 'Buen trabajo.'}"`, color: TEXT_MAIN, italics: true, size: 22 })]
                                            })
                                        ]
                                    })
                                ]
                            })
                        ]
                    }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),

                    // Columns
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        width: { size: 50, type: WidthType.PERCENTAGE },
                                        children: [
                                            new Paragraph({ children: [new TextRun({ text: "✓ ASPECTOS POSITIVOS", color: COLOR_SUCCESS, bold: true, size: 20 })] }),
                                            new Paragraph({ text: "" }),
                                            ...(positives.length > 0 ? positives.flatMap(p => [
                                                createCard(p, COLOR_SUCCESS),
                                                new Paragraph({ text: "" }) // spacing
                                            ]) : [new Paragraph({ children: [new TextRun({ text: "Ninguno reportado.", color: TEXT_MUTED })] })])
                                        ]
                                    }),
                                    new TableCell({
                                        width: { size: 50, type: WidthType.PERCENTAGE },
                                        children: [
                                            new Paragraph({ children: [new TextRun({ text: "! OPORTUNIDADES DE MEJORA", color: COLOR_WARNING, bold: true, size: 20 })] }),
                                            new Paragraph({ text: "" }),
                                            ...(improvements.length > 0 ? improvements.flatMap(p => [
                                                createCard(p, COLOR_WARNING),
                                                new Paragraph({ text: "" }) // spacing
                                            ]) : [new Paragraph({ children: [new TextRun({ text: "Ninguna identificada.", color: TEXT_MUTED })] })])
                                        ]
                                    })
                                ]
                            })
                        ]
                    })
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
    const pageWidth = 210;
    const margin = 20;
    let y = 30;

    // Colores base (modo oscuro)
    const bgColor = [15, 23, 42]; // #0f172a
    const cardBgColor = [30, 41, 59]; // #1e293b
    const textColor = [229, 231, 235]; // #e5e7eb
    const mutedColor = [148, 163, 184]; // #94a3b8
    const positiveColor = [34, 197, 94]; // #22c55e
    const warningColor = [245, 158, 11]; // #f59e0b

    // Helper: Fondo global oscuro (asumiendo formato A4 210x297)
    // Cubrimos un poquito más para asegurar llenar
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.rect(0, 0, 210, 300, 'F');

    // Header
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    const safeStudentName = studentName || "Estudiante";
    doc.text(safeStudentName, margin, y);
    
    // Subtítulo
    y += 7;
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("EVALUACIÓN | REPORTE AUTOMATIZADO CON IA", margin, y);

    // Nota (alineada a la derecha)
    doc.setFontSize(24);
    doc.setTextColor(positiveColor[0], positiveColor[1], positiveColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text(`${result.nota || "0"}/100`, pageWidth - margin, y - 7, { align: 'right' });
    doc.setFontSize(8);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text("NOTA FINAL", pageWidth - margin, y, { align: 'right' });

    // Separador
    y += 10;
    doc.setDrawColor(30, 41, 59); // color línea
    doc.line(margin, y, pageWidth - margin, y);
    
    // SECTION: COMENTARIO GENERAL
    y += 15;
    doc.setFontSize(10);
    doc.setTextColor(167, 139, 250); // Morado claro para icono
    doc.setFont("helvetica", "bold");
    doc.text("COMENTARIO GENERAL", margin, y);
    
    y += 6;
    doc.setFillColor(cardBgColor[0], cardBgColor[1], cardBgColor[2]);
    doc.roundedRect(margin, y, 170, 0, 3, 3, 'F'); // El alto se actualizará
    const boxStartY = y;
    
    y += 10;
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    
    const lines = doc.splitTextToSize(`"${result.comentario || 'Buen trabajo.'}"`, 150);
    doc.text(lines, margin + 10, y);
    
    const boxHeight = (lines.length * 5) + 20;
    // Redraw the rounded rect with correct height, then redraw text over it
    doc.setFillColor(cardBgColor[0], cardBgColor[1], cardBgColor[2]);
    doc.roundedRect(margin, boxStartY, 170, boxHeight, 3, 3, 'F');
    doc.text(lines, margin + 10, boxStartY + 12);
    
    y = boxStartY + boxHeight + 20;

    // Check if we need a new page before Columns
    if (y > 220) {
        doc.addPage();
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(0, 0, 210, 300, 'F');
        y = 30;
    }

    // SECTION: COLUMNAS
    const colWidth = 80;
    const col1X = margin;
    const col2X = margin + colWidth + 10;

    // Títulos de columnas
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(positiveColor[0], positiveColor[1], positiveColor[2]);
    doc.text("✓ ASPECTOS POSITIVOS", col1X, y);
    
    doc.setTextColor(warningColor[0], warningColor[1], warningColor[2]);
    doc.text("! OPORTUNIDADES DE MEJORA", col2X, y);

    y += 10;
    
    const currentY = y;
    let maxY = y;

    // Helper to draw cards
    const drawCard = (text: string, xPos: number, currentCardY: number, pointColor: number[], highlightColor: number[]) => {
        // Prepare text
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const cleanText = text.replace(/^\*\*|^\*|^-/, '').trim();
        const parts = cleanText.split('**:');
        
        let cardLines: string[] = [];
        
        // Very basic markdown parse for title
        if (parts.length > 1) {
            const titleLines = doc.splitTextToSize(parts[0] + ":", colWidth - 15);
            const descLines = doc.splitTextToSize(parts.slice(1).join("**:").trim(), colWidth - 15);
            cardLines = [...titleLines, ...descLines];
        } else {
            cardLines = doc.splitTextToSize(cleanText, colWidth - 15);
        }

        const h = (cardLines.length * 4) + 15;
        
        if (currentCardY + h > 280) {
            // Need a new page - simplify logic by ensuring it fits or just draw warning
            // To be robust, if it goes out, we should do a logic, but for now we draw.
        }

        // Draw card bg
        doc.setFillColor(cardBgColor[0], cardBgColor[1], cardBgColor[2]);
        doc.setDrawColor(highlightColor[0], highlightColor[1], highlightColor[2]);
        doc.setLineWidth(0.2);
        // Draw card with subtle border matching color theme
        doc.roundedRect(xPos, currentCardY, colWidth, h, 3, 3, 'FD');
        
        // Draw dot
        doc.setFillColor(pointColor[0], pointColor[1], pointColor[2]);
        doc.circle(xPos + 6, currentCardY + 9, 1, 'F');

        // Draw text
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(cardLines, xPos + 10, currentCardY + 10);

        return currentCardY + h + 5;
    };

    // Draw Positives
    const positives = Array.isArray(result.feedback_positivo) ? result.feedback_positivo : [result.feedback_positivo].filter(Boolean);
    let leftY = currentY;
    
    if (positives.length > 0) {
        positives.forEach(p => {
            if (leftY > 260) {
                doc.addPage();
                doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
                doc.rect(0, 0, 210, 300, 'F');
                leftY = 20;
            }
            leftY = drawCard(p, col1X, leftY, positiveColor, [22, 101, 52]); // darker green border
        });
    } else {
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text("Ninguno reportado.", col1X, leftY);
        leftY += 10;
    }

    // Draw Improvements
    const improvements = Array.isArray(result.mejoras) ? result.mejoras : [result.mejoras].filter(Boolean);
    let rightY = currentY;

    if (improvements.length > 0) {
        improvements.forEach(p => {
             if (rightY > 260) {
                // If left side didn't already page break
                // This is a simple approximation
                if (leftY <= 260) {
                    doc.addPage();
                    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
                    doc.rect(0, 0, 210, 300, 'F');
                }
                rightY = 20;
            }
            rightY = drawCard(p, col2X, rightY, warningColor, [120, 53, 15]); // darker orange border
        });
    } else {
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text("Ninguna identificada. ¡Excelente!", col2X, rightY);
    }

    const safeNameForm = studentName ? studentName.replace(/\s+/g, "_") : "estudiante";
    doc.save(`Retroalimentacion_${safeNameForm}.pdf`);
};
