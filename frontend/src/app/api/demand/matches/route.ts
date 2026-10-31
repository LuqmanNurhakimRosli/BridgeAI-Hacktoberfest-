import { route } from '@/lib/api';
import { handleDemandMatches } from '@/handlers/demand-matches';

export const POST = route(handleDemandMatches, { ai: true });
