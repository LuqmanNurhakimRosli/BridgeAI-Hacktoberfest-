import { route } from '../../../lib/api';
import { handleAnalyze } from '../../../handlers/analyze';

export const POST = route(handleAnalyze, { ai: true });
