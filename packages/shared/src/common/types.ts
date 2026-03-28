import z from 'zod';
import { errorSchema } from './schemas';

export type ErrorResponse = z.infer<typeof errorSchema>;
