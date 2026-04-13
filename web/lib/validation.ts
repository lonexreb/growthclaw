import { z } from "zod/v4";

export const leadsActionSchema = z.object({
  id: z.string().min(1, "Lead ID is required"),
  action: z.enum(["approve", "skip"]),
});

export type LeadsAction = z.infer<typeof leadsActionSchema>;
