import { z } from "zod";

export const ApiErrorSchema = z.object({ error: z.string() }).strict();
export const OkResponseSchema = z.object({ ok: z.literal(true) }).strict();

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type OkResponse = z.infer<typeof OkResponseSchema>;
