import { validateReportModificationWindow } from '../../src/logic/daily-report-management';
import { type ModificationWindowValidationResult } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 報告修正期限管理機能', () => {
  // SCEN-2729: [error] 報告修正期限管理機能 - 修正内容に必須項目である課題内容が欠落しているとき修正禁止エラーが発生する
  test('修正内容に必須項目である課題内容が欠落しているとき修正禁止エラーが発生する', () => {
    const submittedAt = new Date('2024-01-15T08:00:00Z');
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    const currentTimestamp = new Date('2024-01-15T08:45:00Z');

    const result: ModificationWindowValidationResult = validateReportModificationWindow({
      reportId: 'report-001',
      userId: 'user-001',
      currentTimestamp: currentTimestamp,
      morningMeetingStartTime: morningMeetingStartTime,
      reportContent: {
        yesterdayAccomplishment: 'タスクA完了',
        todayPlan: 'タスクB着手',
        challenges: '',
      },
    });

    expect(result.isModificationAllowed).toBe(false);
    expect(result.reason).toMatch(/課題/);
    expect(result.remainingMinutes).toBeLessThan(0);
    expect(result.modificationDeadline).toEqual(
      new Date('2024-01-15T08:50:00Z')
    );
  });
});