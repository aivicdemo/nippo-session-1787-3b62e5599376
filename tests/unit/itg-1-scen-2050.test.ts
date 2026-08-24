import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  test('SCEN-2050: 対策案の文字数がちょうど最大長に達した場合に検証がパスする', () => {
    // Arrange
    const maxCountermeasureLength = 500;
    const countermeasureAtMaxLength = 'a'.repeat(maxCountermeasureLength);
    
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed feature A implementation',
      todayPlan: 'Start testing feature B',
      challenges: 'Database connection timeout issue',
      reportDate: '2024-01-15',
      countermeasure: countermeasureAtMaxLength,
    };

    // Act
    const result = submitDailyReport(input);

    // Assert
    expect(result.isValid).toBe(true);
    expect(result.reportId).toBeDefined();
    expect(result.reportId).toMatch(/^[a-z0-9-]+$/);
    expect(result.submissionTimestamp).toBeDefined();
    expect(result.isWithinDeadline).toBe(true);
  });
});