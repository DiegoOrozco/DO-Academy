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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{student.name}</h1>
          <p className="text-slate-400 text-sm">{student.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/students" className="text-slate-400 hover:text-white">Volver</Link>
          {student.role !== 'ADMIN' && (
            <DeleteStudentButton userId={student.id} />
          )}
        </div>
      </div>

      {/* Inscripciones */}
      <div className="glass-effect rounded-2xl border border-[var(--color-glass-border)] p-5">
        <h2 className="text-lg font-semibold text-white mb-3">Cursos Inscritos</h2>
        {student.enrollments.length === 0 ? (
          <p className="text-slate-500">Sin inscripciones.</p>
        ) : (
          <ul className="list-disc pl-6 text-slate-300">
            {student.enrollments.map((e) => (
              <li key={e.id}>
                <Link href={`/admin/courses/${e.course.id}`} className="hover:underline text-white">
                  {e.course.title}
                </Link>
                <span className="ml-2 text-xs text-slate-500">({e.course.status})</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Actividad en Q&A */}
      <div className="glass-effect rounded-2xl border border-[var(--color-glass-border)] p-5">
        <h2 className="text-lg font-semibold text-white mb-3">Actividad en Q&A</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-slate-400 font-medium mb-2">Posts</h3>
            {student.posts.length === 0 ? (
              <p className="text-slate-500">Sin posts.</p>
            ) : (
              <ul className="space-y-2">
                {student.posts.map((p) => (
                  <li key={p.id} className="text-slate-300">
                    <span className="text-white font-medium">{p.day?.title || "Día eliminado"}</span>
                    <span className="ml-2 text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</span>
                    <span className="ml-3 text-xs text-slate-500">Respuestas: {p.replies?.length || 0}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-slate-400 font-medium mb-2">Respuestas</h3>
            {student.replies.length === 0 ? (
              <p className="text-slate-500">Sin respuestas.</p>
            ) : (
              <ul className="space-y-2">
                {student.replies.map((r) => (
                  <li key={r.id} className="text-slate-300">
                    <span className="text-white font-medium">Post: {r.post?.id || "Post eliminado"}</span>
                    <span className="ml-2 text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Progreso de Video */}
      <div className="glass-effect rounded-2xl border border-[var(--color-glass-border)] p-5">
        <h2 className="text-lg font-semibold text-white mb-2">Consumo de Video</h2>
        {videoProgresses.length === 0 ? (
          <p className="text-slate-500 text-sm">Sin datos de reproducción aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">Semana / Día</th>
                  <th className="text-left font-semibold px-4 py-3">Título</th>
                  <th className="text-left font-semibold px-4 py-3">Segundos</th>
                  <th className="text-left font-semibold px-4 py-3">% Aprox</th>
                  <th className="text-left font-semibold px-4 py-3">Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {videoProgresses.map((vp) => (
                  <tr key={vp.id} className="border-t border-[var(--color-glass-border)]">
                    <td className="px-4 py-3 text-slate-300">{vp.day?.week?.title || "Semana"}</td>
                    <td className="px-4 py-3 text-white">{vp.day?.title || "Día"}</td>
                    <td className="px-4 py-3 text-slate-300">{vp.seconds}s</td>
                    <td className="px-4 py-3 text-slate-300">{vp.percent ?? 0}%</td>
                    <td className="px-4 py-3 text-slate-300">{new Date(vp.updatedAt).toLocaleString()}</td>
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
