import { route } from '@/lib/api';
import { handleNotImplemented } from '@/handlers/not-implemented';

// P2: deal event log. P0 deals append events in the browser only.
export const POST = route(handleNotImplemented);

