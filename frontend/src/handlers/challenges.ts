import { catalogCountries, demandBriefs } from '../lib/catalog';
import { AppError } from '../lib/errors';
import { challengesQuerySchema } from '../lib/schemas';
import { NOTICE_SYNTHETIC } from '../lib/constants';

// GET /api/challenges. No model call.
export async function handleChallenges(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const query = challengesQuerySchema.parse(Object.fromEntries(url.searchParams));
  if (query.country && !catalogCountries.includes(query.country)) {
    throw new AppError('VALIDATION_ERROR', `country must be one of: ${catalogCountries.join(', ')}.`);
  }
  const briefs = demandBriefs
    .filter((d) => !query.country || d.country === query.country)
    .filter((d) => !query.type || d.demand_kind === query.type)
    .slice(0, query.limit);
  return Response.json({ briefs, notice: NOTICE_SYNTHETIC });
}
