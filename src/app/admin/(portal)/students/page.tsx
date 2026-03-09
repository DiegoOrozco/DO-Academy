import prisma from "@/lib/prisma";
import AdminStudentsClient from "./AdminStudentsClient";

export const dynamic = 'force-dynamic';

export default async function AdminStudentsPage() {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { createdAt: "desc" },
    include: {
      enrollments: { select: { course: { select: { id: true, title: true, status: true } } } },
      posts: { select: { id: true } },
      replies: { select: { id: true } },
    },
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <AdminStudentsClient initialStudents={students} />
    </div>
  );
}

