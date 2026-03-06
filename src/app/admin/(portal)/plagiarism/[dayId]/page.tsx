import { prisma } from "@/lib/prisma";
import PlagiarismReportClient from "./PlagiarismReportClient";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ dayId: string }>;
}

export default async function PlagiarismReportPage({ params }: PageProps) {
    const { dayId } = await params;

    const day = await prisma.day.findUnique({
        where: { id: dayId },
        select: { title: true }
    });

    if (!day) return notFound();

    return (
        <div className="max-w-6xl mx-auto p-10">
            <PlagiarismReportClient dayId={dayId} dayTitle={day.title} />
        </div>
    );
}
