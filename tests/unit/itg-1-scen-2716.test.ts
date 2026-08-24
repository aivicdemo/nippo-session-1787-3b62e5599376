import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  test('SCEN-2716: [error] 報告修正期限管理機能 - 修正内容データが null のとき修正禁止エラーが発生する', () => {
    // Setup: 修正対象の報告記録を準備
    const reportId = 'report-001';
    const userId = 'user-001';
    const currentTimestamp = new Date('2024-01-15T08:55:00Z');
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');

    // 修正内容データが null の修正要求オブジェクトを構築
    const modificationRequest = {
      reportId,
      userId,
      currentTimestamp,
      morningMeetingStartTime,
    };

    // Act: validateReportModificationWindow() を実行
    const result = validateReportModificationWindow(modificationRequest);

    // Assert: エラーオブジェクトを検証
    expect(result.isModificationAllowed).toBe(false);
    expect(result.reason).toMatch(/修正内容/);
    expect(result.remainingMinutes).toBeLessThan(0);
    expect(result.modificationDeadline).toBeInstanceOf(Date);
  });
});