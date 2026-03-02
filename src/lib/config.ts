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
