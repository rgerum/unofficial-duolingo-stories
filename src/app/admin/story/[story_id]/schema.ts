import { z } from "zod";

export const StorySchema = z.object({
  id: z.number(),
  name: z.string(),
  image: z.string(),
  public: z.boolean(),
  short: z.string(),
  approvals: z
    .array(
      z.object({
        id: z.number(),
        date: z.date(),
        name: z.string(),
      })
    )
    .default([]),
});

export type Story = z.infer<typeof StorySchema>;
