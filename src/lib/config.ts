import prisma from "./prisma";

export async function getSiteConfig(key: string) {
    const config = await prisma.siteConfig.findUnique({
        where: { key }
    });
    return config?.value as any;
}

export async function getAllSiteConfigs() {
    const configs = await prisma.siteConfig.findMany();
    return configs.reduce((acc, curr) => ({
        ...acc,
        [curr.key]: curr.value
    }), {} as Record<string, any>);
}
export async function updateSiteConfig(key: string, value: any) {
    const config = await prisma.siteConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value }
    });
    return config.value as any;
}
