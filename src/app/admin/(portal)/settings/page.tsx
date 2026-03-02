import { getAllSiteConfigs } from "@/lib/config";
import AdminSettingsClient from "./AdminSettingsClient";

export default async function AdminSettingsPage() {
    const configs = await getAllSiteConfigs();

    return (
        <div className="space-y-10">
            <header className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-white tracking-tight">Ajustes del Sitio</h1>
                <p className="text-slate-400 font-medium">Gestiona el contenido de la página de inicio y tu biografía.</p>
            </header>

            <AdminSettingsClient initialConfigs={configs} />
        </div>
    );
}
