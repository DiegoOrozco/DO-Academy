"use client";

import { useTransition } from "react";
import { deleteStudent } from "@/actions/admin-students";

export default function DeleteStudentButton({ userId }: { userId: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = async (e: React.MouseEvent) => {
        // Stop propagation just in case there's an outer link or something
        e.preventDefault();
        e.stopPropagation();

        console.log("CLICK DETECTADO en botón eliminar para:", userId);

        if (!window.confirm("¿ELIMINAR ESTUDIANTE? Esta acción borrará TODO su progreso y cuenta.")) {
            return;
        }

        startTransition(async () => {
            try {
                console.log("Enviando petición de borrado...");
                await deleteStudent(userId);
            } catch (err: any) {
                console.error("Error al borrar:", err);
                alert("Error: " + (err.message || "No se pudo borrar"));
            }
        });
    };

    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="relative z-[100] bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-[10px] md:text-xs font-black uppercase tracking-tighter px-4 py-2 rounded-lg transition-all active:scale-95 cursor-pointer border-2 border-white/20"
        >
            {isPending ? "BORRANDO..." : "ELIMINAR CUENTA"}
        </button>
    );
}
