"use server";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function deleteStudent(userId: string) {
  if (!userId) return redirect("/admin/students");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return redirect("/admin/students");

  if (user.role === "ADMIN") {
    throw new Error("No se puede eliminar un usuario ADMIN.");
  }

  await prisma.user.delete({ where: { id: userId } });
  redirect("/admin/students");
}

