import { route } from '@/lib/api';
import { handleNotImplemented } from '@/handlers/not-implemented';

// P2: aggregation needs authenticated server storage. Insights computes KPIs in the browser for now.
export const GET = route(handleNotImplemented);

