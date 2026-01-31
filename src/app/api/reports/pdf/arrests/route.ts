/**
 * Arrests PDF Report API Route
 */

import { POST_ARRESTS_PDF } from '@/modules/reports/controllers/pdf.controller';

export async function POST(req: NextRequest) {
  return POST_ARRESTS_PDF(req);
}
