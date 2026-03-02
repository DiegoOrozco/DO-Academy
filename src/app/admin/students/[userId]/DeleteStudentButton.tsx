"use client";

import { useTransition } from "react";
import { deleteStudent } from "@/actions/admin-students";

export default function DeleteStudentButton({ userId }: { userId: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = async () => {
        if (!confirm("¿Eliminar este estudiante? Esta acción es irreversible.")) return;

        startTransition(async () => {
            try {
                await deleteStudent(userId);
            } catch (err: any) {
                alert(err.message || "Error al eliminar estudiante");
            }
        });
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
            {isPending ? "Eliminando..." : "Eliminar"}
        </button>
    );
}
