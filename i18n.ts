export const locales = ['ko', 'en'] as const;
export const defaultLocale = 'ko' as const;

export type AppLocale = (typeof locales)[number];
