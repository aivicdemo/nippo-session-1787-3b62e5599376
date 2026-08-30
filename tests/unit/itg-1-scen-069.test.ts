import { aggregateSubmissionStatusSummary } from '../../src/logic/dashboard-presentation';

describe('aggregateSubmissionStatusSummary', () => {
  // SCEN-069
  test('should throw error when reportDate is a future date', () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDateString = tomorrow.toISOString().split('T')[0];

    expect(() =>
      aggregateSubmissionStatusSummary({
        teamId: 'team-001',
        reportDate: futureDateString,
        requestUserId: 'user-001',
      })
    ).toThrow(/報告日は本日以前の日付を指定してください/);
  });
});