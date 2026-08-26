import { getDeadlineInfo } from '../../src/logic/report-deadline-management';

describe('共通', () => {
  // SCEN-029
  test('[normal] 報告期限までの残り時間と期限情報を計算して返す', () => {
    const currentDateTime = new Date('2024-01-15T09:00:00Z');
    const deadlineDateTime = new Date('2024-01-15T10:00:00Z');

    const result = getDeadlineInfo({
      deadlineDateTime,
      currentDateTime,
    });

    expect(result.remainingMinutes).toBe(60);
    expect(result.deadlineAt).toBe('2024-01-15T10:00:00');
    expect(result.isOverdue).toBe(false);
    expect(result.isPastDeadline).toBe(false);
  });
});