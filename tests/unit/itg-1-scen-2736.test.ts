import { validateReportModificationWindow } from '../../src/logic/daily-report-management';
import { type ReportModificationWindowInput, type ReportModificationWindowOutput } from '../../src/logic/daily-report-management';

describe('Report Modification Window Validation', () => {
  // SCEN-2736: [edge] 報告内容修正期限判定機能 - 修正開始から朝会開始までの経過時間が0秒の場合、修正は可能である
  test('should allow modification when elapsed time is exactly 0 seconds (submitted at same instant as morning meeting start time)', () => {
    const morningMeetingStartTime = '09:00';
    const submittedAt = '2024-01-15T09:00:00Z';

    const input: ReportModificationWindowInput = {
      submittedAt,
      morningMeetingStartTime,
    };

    const result: ReportModificationWindowOutput = validateReportModificationWindow(input);

    expect(result.isWithinModificationWindow).toBe(true);
  });
});