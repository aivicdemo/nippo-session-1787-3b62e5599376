import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-1549
  test('複数課題で発生頻度が同値の場合、影響度スコアで正しく順序付けされる', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    mockTextAnalysisServiceAdapter.assessImpactScore
      .mockResolvedValueOnce(60)
      .mockResolvedValueOnce(80);

    const issue1: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続タイムアウト',
      occurrenceFrequency: 3,
      impactScore: 60,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T10:00:00Z',
      teamId: 'team-001',
    };

    const issue2: IssuePriorityScoringInput = {
      issueId: 'issue-002',
      issueContent: 'ネットワーク障害',
      occurrenceFrequency: 3,
      impactScore: 80,
      affectedTeamCount: 3,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15T10:30:00Z',
      teamId: 'team-001',
    };

    const result1 = calculateIssuePriorityScore(issue1);
    const result2 = calculateIssuePriorityScore(issue2);

    expect(result2.priorityScore).toBeGreaterThan(result1.priorityScore);
    expect(result1.priorityRank).toBe('中');
    expect(result2.priorityRank).toBe('高');
  });
});