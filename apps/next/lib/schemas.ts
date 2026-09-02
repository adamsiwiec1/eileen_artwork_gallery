import { z } from 'zod';

export const addressSchema = z.object({
  name: z.string().trim().min(1).max(120),
  street1: z.string().trim().min(3).max(120),
  street2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(2).max(40),
  zip: z.string().trim().min(3).max(16),
  country: z.string().trim().min(2).max(2).default('US'),
  phone: z.string().trim().max(24).optional(),
});

export const quoteSchema = z.object({
  mediumId: z.string(),
  sizeId: z.string(),
  rushTierId: z.string(),
  framed: z.boolean().default(false),
  shippingCents: z.number().int().nonnegative().optional(),
  shippingLabel: z.string().optional(),
});

export const ratesSchema = z.object({
  address: addressSchema,
});

export const generateSchema = z.object({ prompt: z.string().trim().min(3).max(2000) });

export const refineSchema = z.object({
  sessionId: z.string(),
  instruction: z.string().trim().min(2).max(2000),
});

export const checkoutSchema = quoteSchema.extend({
  sessionId: z.string(),
  name: z.string().trim().min(1).max(120),
  email: z.email(),
  address: addressSchema,
  easypostShipmentId: z.string().optional(),
  selectedRateId: z.string().optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().min(3).max(200),
  pass: z.string().min(1).max(200),
});

export const orderCostsSchema = z.object({
  canvasCents: z.number().int().nonnegative(),
  paintCents: z.number().int().nonnegative(),
  otherMaterialsCents: z.number().int().nonnegative(),
  hoursWorked: z.number().nonnegative(),
  hourlyRateCents: z.number().int().nonnegative(),
  status: z
    .enum(['pending_review', 'accepted', 'denied', 'in_progress', 'ready_to_ship', 'shipped'])
    .optional(),
});

export const pickupSchema = z.object({
  min: z.string().min(8),
  max: z.string().min(8),
  instructions: z.string().max(400).optional(),
});

export const emailSchema = z.object({
  preset: z.enum(['accepted', 'in_progress', 'ready_to_ship', 'shipped', 'denied']),
  note: z.string().max(2000).optional(),
});

export const settingsSchema = z.object({
  hourlyRateCents: z.number().int().nonnegative(),
  defaultCanvasCents: z.number().int().nonnegative(),
  defaultPaintCents: z.number().int().nonnegative(),
});
