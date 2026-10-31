import { route } from '@/lib/api';
import { handleNotImplemented } from '@/handlers/not-implemented';

// P2: server-owned deal records. P0 deals live in the browser only.
export const GET = route(handleNotImplemented);
export const POST = route(handleNotImplemented);

