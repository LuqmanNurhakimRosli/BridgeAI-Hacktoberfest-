import { route } from '../../../lib/api';
import { handleChallenges } from '../../../handlers/challenges';

export const GET = route(handleChallenges);
