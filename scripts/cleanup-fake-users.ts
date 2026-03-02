import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const byPassword = process.argv.includes("--by-password");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const baseWhere = {
    AND: [
      { email: { startsWith: "guest_" } },
      { email: { endsWith: "@doacademy.com" } },
      { role: "STUDENT" },
    ],
  } as const;

  const where = byPassword
    ? {
        OR: [
          baseWhere,
          { AND: [{ password: "guest" }, { role: "STUDENT" }] },
        ],
      }
    : baseWhere;

  try {
    const count = await prisma.user.count({ where: where as any });
    console.log(`Usuarios ficticios detectados: ${count}`);

    if (dryRun) {
      console.log("Modo inspección (--dry-run): no se eliminará nada.");
      return;
    }

    const res = await prisma.user.deleteMany({ where: where as any });
    console.log(`Usuarios eliminados: ${res.count}`);
  } finally {
    await Promise.allSettled([
      (async () => {
        try {
          await (global as any).prisma?.$disconnect?.();
        } catch {}
      })(),
    ]);
  }
}

main().catch((err) => {
  console.error("Error ejecutando cleanup:", err);
  process.exit(1);
});

