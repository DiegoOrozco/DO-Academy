"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Users, Trash2, UserPlus, X, Search, Loader2, Edit3 } from "lucide-react";
import { createGroupAction, getCourseGroupsAction, getCourseStudentsAction, deleteGroupAction, updateGroupMembersAction } from "@/actions/admin-groups";

interface Student {
    id: string;
    name: string;
    email: string;
}

interface Group {
    id: string;
    name: string;
    members: Student[];
}

export default function GroupManagement({ courseId }: { courseId: string }) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newGroupName, setNewGroupName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [searchStudent, setSearchStudent] = useState("");

    const loadData = async () => {
        setIsLoading(true);
        const [resG, resS] = await Promise.all([
            getCourseGroupsAction(courseId),
            getCourseStudentsAction(courseId)
        ]);

        if (resG.success) setGroups(resG.groups as Group[]);
        if (resS.success) setStudents(resS.students as Student[]);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [courseId]);

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;
        setIsCreating(true);
        const res = await createGroupAction(courseId, newGroupName);
        if (res.success) {
            setNewGroupName("");
            loadData();
        } else {
            alert("Error: " + res.error);
        }
        setIsCreating(false);
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm("¿Seguro que deseas eliminar este grupo? Los miembros no serán borrados, solo la asociación al grupo.")) return;
        const res = await deleteGroupAction(groupId, courseId);
        if (res.success) {
            loadData();
            if (selectedGroup?.id === groupId) setSelectedGroup(null);
        }
    };

    const toggleMember = async (groupId: string, userId: string, isMember: boolean) => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        let newUserIds = group.members.map(m => m.id);
        if (isMember) {
            newUserIds = newUserIds.filter(id => id !== userId);
        } else {
            newUserIds.push(userId);
        }

        startTransition(async () => {
            const res = await updateGroupMembersAction(groupId, newUserIds, courseId);
            if (res.success) {
                // Update local state for immediate feedback
                setGroups(prev => prev.map(g => {
                    if (g.id === groupId) {
                        const newMembers = isMember 
                            ? g.members.filter(m => m.id !== userId)
                            : [...g.members, students.find(s => s.id === userId)!];
                        return { ...g, members: newMembers };
                    }
                    return g;
                }));
                // Also update selected group if any
                if (selectedGroup?.id === groupId) {
                    setSelectedGroup(prev => {
                        if (!prev) return null;
                        const newMembers = isMember 
                            ? prev.members.filter(m => m.id !== userId)
                            : [...prev.members, students.find(s => s.id === userId)!];
                        return { ...prev, members: newMembers };
                    });
                }
            }
        });
    };

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(searchStudent.toLowerCase()) || 
        s.email.toLowerCase().includes(searchStudent.toLowerCase())
    );

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-20 text-slate-500 gap-4">
            <Loader2 className="animate-spin text-[var(--color-primary)]" size={32} />
            <p className="text-xs font-black uppercase tracking-widest">Cargando Grupos...</p>
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[500px]">
            {/* Groups Column */}
            <div className="w-full lg:w-1/3 flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users className="text-[var(--color-primary)]" size={20} />
                        Grupos del Curso
                    </h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Nombre del grupo..."
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[var(--color-primary)]"
                        />
                        <button
                            onClick={handleCreateGroup}
                            disabled={isCreating || !newGroupName.trim()}
                            className="p-2 bg-[var(--color-primary)] text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-all font-bold text-sm flex items-center justify-center min-w-[40px]"
                        >
                            {isCreating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {groups.length === 0 ? (
                        <div className="p-10 border border-dashed border-white/10 rounded-2xl text-center text-slate-500 italic text-sm">
                            No hay grupos creados todavía.
                        </div>
                    ) : (
                        groups.map((group) => (
                            <div 
                                key={group.id}
                                onClick={() => setSelectedGroup(group)}
                                className={`group p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                                    selectedGroup?.id === group.id 
                                    ? "bg-[var(--color-primary)]/20 border-[var(--color-primary)] shadow-[0_0_20px_rgba(59,130,246,0.1)]" 
                                    : "bg-black/30 border-white/5 hover:border-[var(--color-primary)]/50"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${selectedGroup?.id === group.id ? "bg-[var(--color-primary)] text-white" : "bg-white/5 text-slate-500"}`}>
                                        <Users size={16} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{group.name}</h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">{group.members.length} Integrantes</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                                    className="p-2 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Members Management Panel */}
            <div className="flex-1 glass-effect border border-white/5 rounded-3xl p-6 flex flex-col gap-6">
                {!selectedGroup ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                            <UserPlus size={32} />
                        </div>
                        <div>
                            <p className="font-black uppercase tracking-widest text-xs">Gestión de Integrantes</p>
                            <p className="text-sm italic mt-1">Selecciona un grupo a la izquierda para empezar a añadir estudiantes.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-xl font-black text-white flex items-center gap-3">
                                    <Edit3 className="text-[var(--color-primary)]" size={24} />
                                    {selectedGroup.name}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                                    Añade o quita integrantes de este grupo
                                </p>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    value={searchStudent}
                                    onChange={(e) => setSearchStudent(e.target.value)}
                                    placeholder="Buscar estudiante..."
                                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pr-2 custom-scrollbar">
                            {filteredStudents.length === 0 ? (
                                <div className="col-span-full py-10 text-center text-slate-500 italic text-sm">
                                    No se encontraron estudiantes para este criterio.
                                </div>
                            ) : (
                                filteredStudents.map(student => {
                                    const isMember = selectedGroup.members.some(m => m.id === student.id);
                                    return (
                                        <div 
                                            key={student.id}
                                            onClick={() => !isPending && toggleMember(selectedGroup.id, student.id, isMember)}
                                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                                                isMember 
                                                ? "bg-emerald-500/10 border-emerald-500/30" 
                                                : "bg-white/5 border-white/5 hover:border-white/10"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                                    isMember ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-400"
                                                }`}>
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className={`text-sm font-bold truncate ${isMember ? "text-emerald-400" : "text-white"}`}>{student.name}</p>
                                                    <p className="text-[10px] text-slate-500 truncate">{student.email}</p>
                                                </div>
                                            </div>
                                            {isPending ? (
                                                <Loader2 className="animate-spin text-slate-500" size={18} />
                                            ) : isMember ? (
                                                <div className="p-1.5 bg-emerald-500/20 text-emerald-500 rounded-full">
                                                    <X size={14} />
                                                </div>
                                            ) : (
                                                <div className="p-1.5 bg-white/5 text-slate-500 rounded-full">
                                                    <Plus size={14} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
