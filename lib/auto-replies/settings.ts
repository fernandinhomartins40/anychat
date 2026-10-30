import { z } from "zod";

/** Account-level welcome message and default reply (PRD A5). */

export const MIN_COOLDOWN_HOURS = 1;
export const MAX_COOLDOWN_HOURS = 168;
export const DEFAULT_COOLDOWN_HOURS = 24;
// Instagram caps a text DM at 1000 characters.
export const MAX_AUTO_REPLY_LENGTH = 1000;

export const autoReplySettingsSchema = z
  .object({
    instagramAccountId: z.string().min(1),
    welcomeEnabled: z.boolean(),
    welcomeMessage: z.string().max(MAX_AUTO_REPLY_LENGTH),
    defaultReplyEnabled: z.boolean(),
    defaultReplyMessage: z.string().max(MAX_AUTO_REPLY_LENGTH),
    defaultReplyCooldownHours: z
      .number()
      .int()
      .min(MIN_COOLDOWN_HOURS)
      .max(MAX_COOLDOWN_HOURS),
  })
  .refine((v) => !v.welcomeEnabled || v.welcomeMessage.trim().length > 0, {
    message: "Welcome message is required when enabled",
    path: ["welcomeMessage"],
  })
  .refine((v) => !v.defaultReplyEnabled || v.defaultReplyMessage.trim().length > 0, {
    message: "Default reply is required when enabled",
    path: ["defaultReplyMessage"],
  });

export type AutoReplySettingsInput = z.infer<typeof autoReplySettingsSchema>;

export const EMPTY_AUTO_REPLY_SETTINGS = {
  welcomeEnabled: false,
  welcomeMessage: "",
  defaultReplyEnabled: false,
  defaultReplyMessage: "",
  defaultReplyCooldownHours: DEFAULT_COOLDOWN_HOURS,
};

/** Clamps a stored cooldown into the supported range. */
export function cooldownMs(hours: number): number {
  const clamped = Math.min(MAX_COOLDOWN_HOURS, Math.max(MIN_COOLDOWN_HOURS, Math.round(hours) || DEFAULT_COOLDOWN_HOURS));
  return clamped * 60 * 60 * 1000;
}
