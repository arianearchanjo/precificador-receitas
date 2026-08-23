export const UNIDADES = ["g", "ml", "un", "kg", "l"] as const;
export type Unidade = (typeof UNIDADES)[number];
