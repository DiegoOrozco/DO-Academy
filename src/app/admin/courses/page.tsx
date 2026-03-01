import prisma from "@/lib/prisma";
import AdminCoursesClient from "./AdminCoursesClient";

export default async function AdminCoursesPage() {
    const courses = await prisma.course.findMany({
        orderBy: { id: 'asc' }
    });

    const safeCourses = JSON.parse(JSON.stringify(courses));

    return <AdminCoursesClient initialCourses={safeCourses} />;
}
