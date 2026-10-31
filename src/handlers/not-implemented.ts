import { AppError } from '../lib/errors';

// Server-side deal storage is P2. Routes exist so the contract is visible, but they refuse honestly.
export async function handleNotImplemented(): Promise<Response> {
  throw new AppError(
    'NOT_IMPLEMENTED',
    'Server-side deal storage is not available in P0. Deals are stored only in this browser.',
  );
}
