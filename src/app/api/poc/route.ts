import { route } from '../../../lib/api';
import { handlePoc } from '../../../handlers/poc';

export const POST = route(handlePoc, { ai: true });
