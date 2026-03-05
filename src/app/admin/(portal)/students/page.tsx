import prisma from "@/lib/prisma";
import Link from "next/link";
import { CheckCircle2, Clock, User } from "lucide-react";

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
        <p className="text-sm md:text-base text-slate-400">Listado de estudiantes registrados y su actividad.</p>
      </div>

      <div className="glass-effect rounded-2xl border border-[var(--color-glass-border)] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-white/5 text-slate-400">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Nombre</th>
                <th className="text-left font-semibold px-4 py-3">Email</th>
                <th className="text-left font-semibold px-4 py-3">Cursos</th>
                <th className="text-left font-semibold px-4 py-3 text-center">Posts/Resp</th>
                <th className="text-left font-semibold px-4 py-3 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-[var(--color-glass-border)] hover:bg-white/5 transition-colors group">
                  <td className="px-4 py-3 text-white font-medium whitespace-nowrap flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-slate-400 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all">
                      {s.name.charAt(0)}
                    </div>
                    {s.name}
                  </td>
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                    <span className="text-xs opacity-60 font-mono">{s.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex -space-x-2">
                      {s.enrollments.slice(0, 3).map((e, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-[var(--color-primary)] border-2 border-[var(--color-background-dark)] flex items-center justify-center text-[8px] text-white font-bold" title={e.course.title}>
                          {e.course.title.charAt(0)}
                        </div>
                      ))}
                      {s.enrollments.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-[var(--color-background-dark)] flex items-center justify-center text-[8px] text-slate-400 font-bold">
                          +{s.enrollments.length - 3}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs text-center">{s.posts.length} / {s.replies.length}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/students/${s.id}`} className="text-xs font-bold text-[var(--color-primary)] hover:text-white bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)] px-3 py-1 rounded-lg transition-all">Administrar</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {students.length === 0 && (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
            <User size={32} className="opacity-20" />
            No hay estudiantes aún.
          </div>
        )}
      </div>
    </div>
  );
}

