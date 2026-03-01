import prisma from "@/lib/prisma";
import AdminCoursesClient from "./AdminCoursesClient";

export default async function AdminCoursesPage() {
    const courses = await prisma.course.findMany({
        orderBy: { id: 'asc' }
    });

    return <AdminCoursesClient initialCourses={courses} />;
}
