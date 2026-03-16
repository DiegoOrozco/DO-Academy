import { getCourseAnalyticsData } from "@/actions/admin-analytics";
import CourseAnalyticsClient from "./CourseAnalyticsClient";
import { notFound } from "next/navigation";

export default async function CourseAnalyticsPage({
    params
}: {
    params: Promise<{ courseId: string }>
}) {
    const { courseId } = await params;
    const result = await getCourseAnalyticsData(courseId);

    if (!result.success || !result.data) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-white">Error al cargar analíticas</h1>
                <p className="text-slate-400 mt-2">{result.error || "No se pudieron obtener los datos."}</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
            <CourseAnalyticsClient courseId={courseId} data={result.data} />
        </div>
    );
}
