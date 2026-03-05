"use client";

import { useState } from "react";
import { toggleEnrollmentStatus, unenrollStudent } from "@/actions/admin-students-pro";
import { Shield, ShieldAlert, Trash2 } from "lucide-react";

export default function EnrollmentManager({ enrollment }: { enrollment: any }) {
    const [status, setStatus] = useState(enrollment.status);
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        setLoading(true);
        const nextStatus = status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        await toggleEnrollmentStatus(enrollment.id, nextStatus);
        setStatus(nextStatus);
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!confirm("¿Seguro que quieres quitar al estudiante de este curso? Esto borrará su progreso en este curso.")) return;
        setLoading(true);
        await unenrollStudent(enrollment.id);
        window.location.reload();
    };

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handleToggle}
                disabled={loading}
                className={`flex items-center gap-2 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${status === "ACTIVE"
                        ? "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                    }`}
            >
                {status === "ACTIVE" ? <Shield size={12} /> : <ShieldAlert size={12} />}
                {status === "ACTIVE" ? "Activo" : "Inactivo"}
            </button>
            <button
                onClick={handleDelete}
                disabled={loading}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all"
                title="Desvincular del curso"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
}
