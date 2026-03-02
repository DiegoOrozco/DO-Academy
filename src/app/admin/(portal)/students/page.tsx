import prisma from "@/lib/prisma";
import Link from "next/link";

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Estudiantes</h1>
        <p className="text-sm md:text-base text-slate-400">Listado de estudiantes activos y su actividad.</p>
      </div>

      <div className="glass-effect rounded-2xl border border-[var(--color-glass-border)] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-white/5 text-slate-400">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Nombre</th>
                <th className="text-left font-semibold px-4 py-3">Email</th>
                <th className="text-left font-semibold px-4 py-3">Cursos</th>
                <th className="text-left font-semibold px-4 py-3">Posts</th>
                <th className="text-left font-semibold px-4 py-3">Respuestas</th>
                <th className="text-left font-semibold px-4 py-3">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-[var(--color-glass-border)] hover:bg-white/5">
                  <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{s.name}</td>
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{s.email}</td>
                  <td className="px-4 py-3 text-slate-300">{s.enrollments.length}</td>
                  <td className="px-4 py-3 text-slate-300">{s.posts.length}</td>
                  <td className="px-4 py-3 text-slate-300">{s.replies.length}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/students/${s.id}`} className="text-[var(--color-primary)] hover:underline">Ver</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {students.length === 0 && (
          <div className="p-8 text-center text-slate-500">No hay estudiantes aún.</div>
        )}
      </div>
    </div>
  );
}

