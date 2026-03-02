import prisma from "@/lib/prisma";
import Link from "next/link";
import DeleteStudentButton from "./DeleteStudentButton";

export const dynamic = 'force-dynamic';

export default async function AdminStudentDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  let student = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      enrollments: {
        include: {
          course: { select: { id: true, title: true, status: true } },
        },
      },
      posts: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          day: {
            select: {
              id: true,
              title: true,
              week: { select: { id: true, title: true, courseId: true } },
            },
          },
          replies: true,
        },
      },
      replies: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          post: true,
        },
      },
    },
  });

  // Best-effort fallback if VideoProgress isn't available
  let videoProgresses: any[] = [];
  if (student) {
    try {
      videoProgresses = await prisma.videoProgress.findMany({
        where: { userId },
        include: {
          day: { select: { id: true, title: true, week: { select: { id: true, title: true, courseId: true } } } },
        },
      });
    } catch {
      videoProgresses = [];
    }
  }

  if (!student) {
    return <div className="p-8 text-slate-400">Estudiante no encontrado.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">{student.name}</h1>
          <p className="text-slate-400 text-xs md:text-sm">{student.email}</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <Link href="/admin/students" className="text-xs md:text-sm text-slate-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 transition-colors">Volver</Link>
          {student.role !== 'ADMIN' && (
            <DeleteStudentButton userId={student.id} />
          )}
        </div>
      </div>

      {/* Inscripciones */}
      <div className="glass-effect rounded-2xl border border-[var(--color-glass-border)] p-4 md:p-5">
        <h2 className="text-base md:text-lg font-semibold text-white mb-3">Cursos Inscritos</h2>
        {student.enrollments.length === 0 ? (
          <p className="text-slate-500 text-sm">Sin inscripciones.</p>
        ) : (
          <ul className="list-disc pl-6 text-slate-300 text-sm md:text-base space-y-1">
            {student.enrollments.map((e: any) => (
              <li key={e.id}>
                <Link href={`/admin/courses/${e.course.id}`} className="hover:underline text-white">
                  {e.course.title}
                </Link>
                <span className="ml-2 text-[10px] md:text-xs text-slate-500 uppercase tracking-wider font-bold">({e.course.status})</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Actividad en Q&A */}
      <div className="glass-effect rounded-2xl border border-[var(--color-glass-border)] p-4 md:p-5">
        <h2 className="text-base md:text-lg font-semibold text-white mb-3">Actividad en Q&A</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-widest mb-3">Posts</h3>
            {student.posts.length === 0 ? (
              <p className="text-slate-500 text-sm italic">Sin posts.</p>
            ) : (
              <ul className="space-y-3">
                {student.posts.map((p: any) => (
                  <li key={p.id} className="text-sm border-l-2 border-white/5 pl-3 py-1">
                    <p className="text-white font-medium leading-tight">{p.day?.title || "Día eliminado"}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</span>
                      <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">Respuestas: {p.replies?.length || 0}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-widest mb-3">Respuestas</h3>
            {student.replies.length === 0 ? (
              <p className="text-slate-500 text-sm italic">Sin respuestas.</p>
            ) : (
              <ul className="space-y-3">
                {student.replies.map((r: any) => (
                  <li key={r.id} className="text-sm border-l-2 border-white/5 pl-3 py-1">
                    <p className="text-white font-medium leading-tight">Post: {r.post?.id.slice(-8) || "Post eliminado"}...</p>
                    <span className="text-[10px] text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Progreso de Video */}
      <div className="glass-effect rounded-2xl border border-[var(--color-glass-border)] p-4 md:p-5">
        <h2 className="text-base md:text-lg font-semibold text-white mb-2">Consumo de Video</h2>
        {videoProgresses.length === 0 ? (
          <p className="text-slate-500 text-sm">Sin datos de reproducción aún.</p>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider">Semana / Día</th>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider">Título</th>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider">Progreso</th>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider">Visto el</th>
                </tr>
              </thead>
              <tbody>
                {videoProgresses.map((vp: any) => (
                  <tr key={vp.id} className="border-t border-[var(--color-glass-border)] group hover:bg-white/5">
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{vp.day?.week?.title || "Semana"}</td>
                    <td className="px-4 py-3 text-white font-medium">{vp.day?.title || "Día"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 font-bold">{vp.percent ?? 0}% completado</span>
                        <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--color-primary)] shadow-[0_0_5px_var(--color-primary)]" style={{ width: `${vp.percent ?? 0}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[10px] whitespace-nowrap">{new Date(vp.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
