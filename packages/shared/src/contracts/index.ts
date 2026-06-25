// @lumi/shared/contracts — schemas Zod dos contratos da API (request/response).
// Usados pela API (validação) e pelo cliente mobile (tipos do TanStack Query).
import { z } from 'zod';

export const ageBandSchema = z.enum(['3-5', '6-8', '9-12']);
export const storyToneSchema = z.enum(['calma', 'divertida', 'aventura']);

/* ------------------------------- Auth ------------------------------- */

export const signupRequestSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  childAge: z.number().int().min(1).max(12),
});
export type SignupRequest = z.infer<typeof signupRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(10),
});
export type RefreshRequest = z.infer<typeof refreshRequestSchema>;

export const userDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  childAge: z.number(),
  ageBand: ageBandSchema,
});
export type UserDto = z.infer<typeof userDtoSchema>;

export const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: userDtoSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

/* ------------------------------ Stories ----------------------------- */

export const createStoryRequestSchema = z.object({
  prompt: z.string().min(1).max(500),
  ageBand: ageBandSchema,
  tone: storyToneSchema,
  imageUri: z.string().url().optional(),
  voiceId: z.string().optional(),
});
export type CreateStoryRequest = z.infer<typeof createStoryRequestSchema>;

export const listStoriesQuerySchema = z.object({
  q: z.string().optional(),
  ageBand: ageBandSchema.optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type ListStoriesQuery = z.infer<typeof listStoriesQuerySchema>;

/* ---------------------------- Community ----------------------------- */

export const commentRequestSchema = z.object({ text: z.string().min(1).max(500) });
export type CommentRequest = z.infer<typeof commentRequestSchema>;

export const rateRequestSchema = z.object({ stars: z.number().int().min(1).max(5) });
export type RateRequest = z.infer<typeof rateRequestSchema>;

export const collectionRequestSchema = z.object({
  title: z.string().min(1).max(80),
  visibility: z.enum(['private', 'public']).default('private'),
});
export type CollectionRequest = z.infer<typeof collectionRequestSchema>;

/* ------------------------------ Errors ------------------------------ */

export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
