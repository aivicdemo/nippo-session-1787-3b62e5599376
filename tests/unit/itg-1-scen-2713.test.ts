import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 報告内容修正受付判定機能', () => {
  // SCEN-2713
  test('同じ報告内容で修正判定を2回実行した場合、同じ結果が返される', () => {
    const submittedAt = '2024-01-15T08:00:00Z';
    const morningMeetingStartTime = '2024-01-15T09:00:00Z';

    const input = {
      submittedAt,
      morningMeetingStartTime,
    };

    const firstResult = validateReportModificationWindow(input);
    const secondResult = validateReportModificationWindow(input);

    expect(firstResult.isWithinModificationWindow).toBe(
      secondResult.isWithinModificationWindow
    );
    expect(firstResult.isWithinModificationWindow).toBe(true);
    expect(firstResult.remainingMinutes).toBe(secondResult.remainingMinutes);
    expect(firstResult.remainingMinutes).toBe(60);
    expect(firstResult.modificationDeadline).toEqual(
      secondResult.modificationDeadline
    );
    expect(firstResult.modificationDeadline).toEqual(new Date('2024-01-15T09:00:00Z'));
  });
});