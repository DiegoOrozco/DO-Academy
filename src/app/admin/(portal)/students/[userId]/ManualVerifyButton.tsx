"use client";

import { useState } from "react";
import { verifyStudentManual } from "@/actions/admin-students-pro";
import { UserCheck } from "lucide-react";

export default function ManualVerifyButton({ userId, isVerified }: { userId: string, isVerified: boolean }) {
    const [loading, setLoading] = useState(false);
    const [verified, setVerified] = useState(isVerified);

    const handleVerify = async () => {
        setLoading(true);
        await verifyStudentManual(userId);
        setVerified(true);
        setLoading(false);
    };

    if (verified) return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-black uppercase tracking-widest">
            <UserCheck size={14} /> Verificado
        </div>
    );

    return (
        <button
            onClick={handleVerify}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all text-xs font-bold"
        >
            <UserCheck size={14} /> Verificar Manualmente
        </button>
    );
}
