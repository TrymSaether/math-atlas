import { z } from "zod";

export const ProgressStatusSchema = z.enum(["learning", "known"]);
export const ProgressEntrySchema = z
  .object({
    nodeId: z.string(),
    status: ProgressStatusSchema,
  })
  .strict();
export const ProgressResponseSchema = z.array(ProgressEntrySchema);
export const PutProgressRequestSchema = z.object({
  nodeId: z.string().min(1),
  status: ProgressStatusSchema,
});

export type ProgressStatus = z.infer<typeof ProgressStatusSchema>;
export type ProgressEntry = z.infer<typeof ProgressEntrySchema>;
