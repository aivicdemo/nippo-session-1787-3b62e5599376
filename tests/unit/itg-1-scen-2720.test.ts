import { validateReportModificationWindow } from '../../src/logic/daily-report-management';
import { type ModificationWindowValidationResult } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 報告修正期限管理機能', () => {
  // SCEN-2720
  test('修正操作時刻が null のとき修正禁止エラーが発生する', () => {
    const reportModificationRequest = {
      reportId: 'RPT-001',
      userId: 'USER-001',
      currentTimestamp: null as unknown as Date,
      morningMeetingStartTime: new Date('2024-01-15T09:00:00Z'),
    };

    const modificationDeadlineConfig = {
      modificationDeadlineOffsetMinutes: 30,
      warningThresholdMinutes: 5,
    };

    expect(() =>
      validateReportModificationWindow(
        reportModificationRequest,
        modificationDeadlineConfig,
      ),
    ).toThrow(/修正操作時刻/);
  });
});