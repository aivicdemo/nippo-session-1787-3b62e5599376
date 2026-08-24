import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('submitDailyReport - character limit validation', () => {
  // SCEN-2651
  test('should reject report submission when yesterdayAccomplishment exceeds 5000 character limit', () => {
    const excess_accomplishment_text = 'a'.repeat(5001);
    const valid_plan_text = 'b'.repeat(500);
    const valid_challenge_text = 'c'.repeat(500);

    const input = {
      userId: 'user-test-001',
      teamId: 'team-001',
      yesterdayAccomplishment: excess_accomplishment_text,
      todayPlan: valid_plan_text,
      challenges: valid_challenge_text,
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/5000文字/);
  });
});