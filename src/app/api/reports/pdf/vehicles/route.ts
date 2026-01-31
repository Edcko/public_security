/**
 * Vehicles PDF Report API Route
 */

import { POST_WEAPONS_PDF } from '@/modules/reports/controllers/pdf.controller';

export async function POST(req: NextRequest) {
  return POST_WEAPONS_PDF(req);
}
