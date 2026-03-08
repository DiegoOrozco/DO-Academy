"use client";

import { useTransition, useState } from "react";
import { deleteStudent } from "@/actions/admin-students";
import ConfirmModal from "@/components/ConfirmModal";

export default function DeleteStudentButton({ userId }: { userId: string }) {
    const [isPending, startTransition] = useTransition();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleDelete = async () => {
        setIsModalOpen(false);
        startTransition(async () => {
            try {
                await deleteStudent(userId);
            } catch (err: any) {
                alert("Error: " + (err.message || "No se pudo borrar"));
            }
        });
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                disabled={isPending}
                className="relative z-[10] bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-[10px] md:text-xs font-black uppercase tracking-tighter px-4 py-2 rounded-lg transition-all active:scale-95 cursor-pointer border-2 border-white/20"
            >
                {isPending ? "BORRANDO..." : "ELIMINAR CUENTA"}
            </button>

            <ConfirmModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleDelete}
                title="¿Eliminar Estudiante?"
                message="Esta acción es irreversible. Se borrará permanentemente la cuenta, el progreso de los cursos, las entregas y toda la actividad de este alumno."
                confirmText="Eliminar Permanentemente"
                variant="danger"
                isLoading={isPending}
            />
        </>
    );
}
