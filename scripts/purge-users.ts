import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

function parseArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function parseList(val?: string): string[] {
  return (val ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const yes = process.argv.includes("--yes") || process.argv.includes("--force");

  // Keep filters
  const keepEmail = parseList(parseArg("keep-email"));
  const keepId = parseList(parseArg("keep-id"));
  const keepRole = parseList(parseArg("keep-role"));

  if (keepEmail.length + keepId.length + keepRole.length === 0 && !yes) {
    console.error(
      "Por seguridad, especifica a quién conservar con --keep-email, --keep-id o --keep-role, o usa --yes para continuar sin filtros."
    );
    process.exit(2);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  // Delete condition: NOT (email in keepEmail OR id in keepId OR role in keepRole)
  const keepClauses: any[] = [];
  if (keepEmail.length) keepClauses.push({ email: { in: keepEmail } });
  if (keepId.length) keepClauses.push({ id: { in: keepId } });
  if (keepRole.length) keepClauses.push({ role: { in: keepRole } });

  const where = keepClauses.length
    ? { NOT: { OR: keepClauses } }
    : {}; // when --yes with no filters, delete all

  try {
    const total = await prisma.user.count();
    const toDelete = await prisma.user.count({ where: where as any });

    console.log(`Usuarios totales: ${total}`);
    console.log(`Usuarios a eliminar: ${toDelete}`);

    if (dryRun) {
      console.log("Modo inspección (--dry-run): no se eliminará nada.");
      return;
    }

    if (!yes) {
      console.error("Agrega --yes para confirmar la eliminación.");
      process.exit(3);
    }

    const res = await prisma.user.deleteMany({ where: where as any });
    console.log(`Usuarios eliminados: ${res.count}`);
  } finally {
    // Best-effort disconnect
    try { await (prisma as any).$disconnect?.(); } catch {}
  }
}

main().catch((err) => {
  console.error("Error en purge-users:", err);
  process.exit(1);
});
