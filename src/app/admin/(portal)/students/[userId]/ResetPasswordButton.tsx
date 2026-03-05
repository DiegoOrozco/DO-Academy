"use client";

import { useState } from "react";
import { resetStudentPassword } from "@/actions/admin-students-pro";
import { Key, Check, X } from "lucide-react";

export default function ResetPasswordButton({ userId }: { userId: string }) {
    const [isResetting, setIsResetting] = useState(false);
    const [newPass, setNewPass] = useState("");
    const [message, setMessage] = useState("");

    const handleReset = async () => {
        if (!newPass) return;
        setIsResetting(true);
        const res = await resetStudentPassword(userId, newPass);
        if (res.success) {
            setMessage("¡Contraseña actualizada!");
            setNewPass("");
            setTimeout(() => {
                setMessage("");
                setIsResetting(false);
            }, 3000);
        } else {
            setMessage("Error al actualizar");
            setIsResetting(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            {!isResetting ? (
                <button
                    onClick={() => setIsResetting(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all text-xs font-bold"
                >
                    <Key size={14} /> Resetear Contraseña
                </button>
            ) : (
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
                    <input
                        type="text"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="Nueva contraseña"
                        className="bg-transparent text-xs text-white focus:outline-none px-2 w-32"
                    />
                    <button onClick={handleReset} className="p-1 text-green-400 hover:bg-green-400/10 rounded">
                        <Check size={14} />
                    </button>
                    <button onClick={() => setIsResetting(false)} className="p-1 text-red-400 hover:bg-red-400/10 rounded">
                        <X size={14} />
                    </button>
                </div>
            )}
            {message && <span className="text-[10px] text-green-400 font-bold ml-2">{message}</span>}
        </div>
    );
}
