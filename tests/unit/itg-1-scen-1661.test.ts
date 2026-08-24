import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  // SCEN-1661: [edge] 課題影響度判定機能 - 複数の課題が同じ優先度スコアを持つ場合、順序が保持される
  test('同一優先度スコアの課題群が作成時刻順序で保持される', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockReturnValue(75),
      classifyIssueSeverity: jest.fn(),
    };

    const createdAt_t1 = new Date('2024-01-15T09:00:00Z');
    const createdAt_t2 = new Date('2024-01-15T09:05:00Z');
    const createdAt_t3 = new Date('2024-01-15T09:10:00Z');

    const issueA = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 5,
      impactScore: 65,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
      createdAt: createdAt_t1,
    };

    const issueB = {
      issueId: 'issue-002',
      issueContent: 'API response delay',
      occurrenceFrequency: 5,
      impactScore: 65,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
      createdAt: createdAt_t2,
    };

    const issueC = {
      issueId: 'issue-003',
      issueContent: 'Memory leak in cache layer',
      occurrenceFrequency: 5,
      impactScore: 65,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
      createdAt: createdAt_t3,
    };

    const issues = [issueA, issueB, issueC];

    const result = calculateIssuePriorityScore(
      issues,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toHaveLength(3);
    expect(result[0].issueId).toBe('issue-001');
    expect(result[0].createdAt).toEqual(createdAt_t1);
    expect(result[1].issueId).toBe('issue-002');
    expect(result[1].createdAt).toEqual(createdAt_t2);
    expect(result[2].issueId).toBe('issue-003');
    expect(result[2].createdAt).toEqual(createdAt_t3);

    expect(result[0].priorityScore).toBe(75);
    expect(result[1].priorityScore).toBe(75);
    expect(result[2].priorityScore).toBe(75);
  });
});