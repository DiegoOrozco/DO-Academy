"use server";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ensureAdmin } from "@/lib/auth-guards";

export async function deleteStudent(userId: string) {
  await ensureAdmin();
  if (!userId) return redirect("/admin/students");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return redirect("/admin/students");

  if (user.role === "ADMIN") {
    throw new Error("No se puede eliminar un usuario ADMIN.");
  }

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/admin/students");
  revalidatePath("/admin");

  redirect("/admin/students");
}

