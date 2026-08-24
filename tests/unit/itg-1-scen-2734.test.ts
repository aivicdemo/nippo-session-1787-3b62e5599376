import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2734: [edge] 報告内容修正期限判定機能 - 朝会開始時刻の1秒前は修正可能である
  test('朝会開始時刻の1秒前は修正可能である', () => {
    const morningMeetingStartTime = new Date('2026-09-15T09:00:00.000Z');
    const currentTimestamp = new Date('2026-09-15T08:59:59.000Z');
    const submittedAt = new Date('2026-09-15T08:30:00.000Z');

    const result = validateReportModificationWindow({
      submittedAt,
      currentTimestamp,
      morningMeetingStartTime,
    });

    expect(result.isModificationAllowed).toBe(true);
    expect(result.remainingMinutes).toBe(1);
    expect(result.modificationDeadline).toEqual(morningMeetingStartTime);
    expect(result.reason).toBeUndefined();
  });
});