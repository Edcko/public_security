/**
 * Personnel PDF Report API Route
 */

import { POST_PERSONNEL_PDF } from '@/modules/reports/controllers/pdf.controller';

export async function POST(req: NextRequest) {
  return POST_PERSONNEL_PDF(req);
}
