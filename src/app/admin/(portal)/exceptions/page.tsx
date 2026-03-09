import { getCoursesAndDays, getExceptions } from "@/actions/exceptions";
import AdminExceptionsClient from "./AdminExceptionsClient";

export const dynamic = "force-dynamic";

export default async function AdminExceptionsPage() {
    const courses = await getCoursesAndDays();
    const exceptions = await getExceptions();

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <AdminExceptionsClient
                courses={courses}
                initialExceptions={exceptions}
            />
        </div>
    );
}
