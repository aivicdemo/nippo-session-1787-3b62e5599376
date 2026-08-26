import { getDeadlineInfo } from '../../src/logic/report-deadline-management';

describe('Report Deadline Management', () => {
  // SCEN-031
  test('should return exceeded status when current time is after deadline', () => {
    const deadlineDateTime = new Date('2024-01-15T09:00:00Z');
    const currentDateTime = new Date('2024-01-15T09:30:00Z');

    const result = getDeadlineInfo({
      deadlineDateTime,
      currentDateTime,
    });

    expect(result.status).toBe('exceeded');
    expect(result.message).toBe('報告期限を超過しています');
    expect(result.remainingMinutes).toBe(-30);
  });
});