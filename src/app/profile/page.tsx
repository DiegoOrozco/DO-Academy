import { getAuthUser } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
    const authUser = await getAuthUser();
    
    if (!authUser) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: authUser.id },
        select: {
            id: true,
            name: true,
            email: true,
            googleId: true,
            pendingEmail: true
        }
    });

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="pt-24 min-h-screen bg-[var(--background)]">
            <ProfileClient user={user} />
        </div>
    );
}
