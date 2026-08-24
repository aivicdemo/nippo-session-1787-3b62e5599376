import { validateReportModificationWindow } from '../../src/logic/daily-report-management';
import type { ReportModificationRequest, ModificationWindowValidationResult } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 報告修正期限管理機能', () => {
  // SCEN-2727: [error] 報告修正期限管理機能 - 修正操作時刻が修正操作を行った日付と異なる日付のとき修正禁止エラーが発生する
  test('修正操作日時が報告日付と異なる場合に修正禁止エラーが発生する', () => {
    const reportDate = new Date('2024-01-15T00:00:00Z');
    const submissionDate = new Date('2024-01-15T08:30:00Z');
    const modificationAttemptDate = new Date('2024-01-16T09:00:00Z');
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');

    const request: ReportModificationRequest = {
      reportId: 'report-001',
      userId: 'user-001',
      currentTimestamp: modificationAttemptDate,
      morningMeetingStartTime: morningMeetingStartTime,
    };

    const result: ModificationWindowValidationResult = validateReportModificationWindow(request);

    expect(result.isModificationAllowed).toBe(false);
    expect(result.reason).toMatch(/修正操作日時.*報告日付.*異なります/);
    expect(result.remainingMinutes).toBeLessThan(0);
    expect(result.modificationDeadline).toEqual(
      new Date('2024-01-15T09:00:00Z')
    );
  });
});