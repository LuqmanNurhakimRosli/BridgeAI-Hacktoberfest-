import { z } from 'zod';
import demandBriefsJson from '../data/demand-briefs.json';
import { demandBriefSchema, type DemandBrief } from './schemas';

// Parsed at module load: a malformed fixture fails fast, not per request.
export const demandBriefs: DemandBrief[] = z.array(demandBriefSchema).parse(demandBriefsJson);

export const demandById = new Map(demandBriefs.map((d) => [d.id, d]));

export const catalogCountries = [...new Set(demandBriefs.map((d) => d.country))];
