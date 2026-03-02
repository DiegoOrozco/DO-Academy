import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function AdminStudentDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const student = await prisma.user.findUnique({
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
        <Link href="/admin/students" className="text-slate-400 hover:text-white">Volver</Link>
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
                    <span className="text-white font-medium">{p.day.title}</span>
                    <span className="ml-2 text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</span>
                    <span className="ml-3 text-xs text-slate-500">Respuestas: {p.replies.length}</span>
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
                    <span className="text-white font-medium">Post: {r.post.id}</span>
                    <span className="ml-2 text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Placeholder de tracking de video: a integrar más adelante */}
      <div className="glass-effect rounded-2xl border border-[var(--color-glass-border)] p-5">
        <h2 className="text-lg font-semibold text-white mb-2">Consumo de Video</h2>
        <p className="text-slate-500 text-sm">Aún no registramos progreso de video. Podemos añadir un modelo `VideoProgress` con porcentaje visto por día.</p>
      </div>
    </div>
  );
}

