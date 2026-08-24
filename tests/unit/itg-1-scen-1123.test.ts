import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Existing Tool Integration Target Confirmation', () => {
  test('SCEN-1123: Multiple valid issues are batch-confirmed as existing tool integration targets with correct priority scores', () => {
    // Test data: 3 valid issues with different severity levels
    const issue1Input = {
      issueId: 'issue-001',
      issueContent: 'バグ修正：ログイン画面でエラーが発生',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-alpha'
    };

    const issue2Input = {
      issueId: 'issue-002',
      issueContent: '機能改善：ダッシュボードの表示速度向上',
      occurrenceFrequency: 3,
      impactScore: 60,
      affectedTeamCount: 2,
      resolutionDaysAverage: 5,
      reportingDate: '2024-01-15',
      teamId: 'team-alpha'
    };

    const issue3Input = {
      issueId: 'issue-003',
      issueContent: 'ドキュメント整備：API仕様書の更新',
      occurrenceFrequency: 1,
      impactScore: 35,
      affectedTeamCount: 1,
      resolutionDaysAverage: 7,
      reportingDate: '2024-01-15',
      teamId: 'team-alpha'
    };

    // Calculate priority scores for all three issues
    const result1 = calculateIssuePriorityScore(issue1Input);
    const result2 = calculateIssuePriorityScore(issue2Input);
    const result3 = calculateIssuePriorityScore(issue3Input);

    // Verify issue 1 (high severity - バグ修正)
    // Formula: frequencyScore (5 normalized to 40) + impactScore (85 normalized to 40) + resolutionDifficultyScore (2 days = low difficulty = 5)
    // frequencyScore: (5 / 10) * 40 = 20
    // impactScore: (85 / 100) * 40 = 34
    // resolutionDifficultyScore: (7 - 2) / 7 * 20 = 14.29 ≈ 14
    // Total: 20 + 34 + 14 = 68, but mapped to high severity boost = 85
    expect(result1.issueId).toBe('issue-001');
    expect(result1.priorityScore).toBe(85);
    expect(result1.priorityRank).toBe('高');
    expect(result1.colorCode).toBe('#FF0000');
    expect(result1.scoreBreakdown.frequencyScore).toBeGreaterThan(0);
    expect(result1.scoreBreakdown.impactScore).toBeGreaterThan(0);
    expect(result1.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result1.scoreBreakdown.frequencyScore + result1.scoreBreakdown.impactScore + result1.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(100);

    // Verify issue 2 (medium severity - 機能改善)
    // frequencyScore: (3 / 10) * 40 = 12
    // impactScore: (60 / 100) * 40 = 24
    // resolutionDifficultyScore: (7 - 5) / 7 * 20 = 5.71 ≈ 6
    // Total: 12 + 24 + 6 = 42, mapped to medium severity = 60
    expect(result2.issueId).toBe('issue-002');
    expect(result2.priorityScore).toBe(60);
    expect(result2.priorityRank).toBe('中');
    expect(result2.colorCode).toBe('#FFFF00');
    expect(result2.scoreBreakdown.frequencyScore).toBeGreaterThan(0);
    expect(result2.scoreBreakdown.impactScore).toBeGreaterThan(0);
    expect(result2.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);

    // Verify issue 3 (low severity - ドキュメント整備)
    // frequencyScore: (1 / 10) * 40 = 4
    // impactScore: (35 / 100) * 40 = 14
    // resolutionDifficultyScore: (7 - 7) / 7 * 20 = 0
    // Total: 4 + 14 + 0 = 18, mapped to low severity = 35
    expect(result3.issueId).toBe('issue-003');
    expect(result3.priorityScore).toBe(35);
    expect(result3.priorityRank).toBe('低');
    expect(result3.colorCode).toBe('#00FF00');
    expect(result3.scoreBreakdown.frequencyScore).toBeGreaterThan(0);
    expect(result3.scoreBreakdown.impactScore).toBeGreaterThan(0);
    expect(result3.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);

    // Verify order by priority score (descending): issue1 (85) > issue2 (60) > issue3 (35)
    const allResults = [result1, result2, result3];
    const sortedByScore = [...allResults].sort((a, b) => b.priorityScore - a.priorityScore);
    expect(sortedByScore[0].priorityScore).toBe(85);
    expect(sortedByScore[1].priorityScore).toBe(60);
    expect(sortedByScore[2].priorityScore).toBe(35);

    // Verify all results have calculatedAt timestamp in ISO 8601 format
    expect(result1.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    expect(result2.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    expect(result3.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);

    // Verify score breakdown values are within valid ranges (0-100 for total, individual components within limits)
    const verifyScoreBreakdown = (breakdown: any) => {
      expect(breakdown.frequencyScore).toBeGreaterThanOrEqual(0);
      expect(breakdown.frequencyScore).toBeLessThanOrEqual(40);
      expect(breakdown.impactScore).toBeGreaterThanOrEqual(0);
      expect(breakdown.impactScore).toBeLessThanOrEqual(40);
      expect(breakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
      expect(breakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    };

    verifyScoreBreakdown(result1.scoreBreakdown);
    verifyScoreBreakdown(result2.scoreBreakdown);
    verifyScoreBreakdown(result3.scoreBreakdown);
  });
});