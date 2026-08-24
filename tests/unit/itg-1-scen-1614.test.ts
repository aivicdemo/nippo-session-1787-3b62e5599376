import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  // SCEN-1614: [normal] TextAnalysisServiceAdapter 正常応答処理 - assessImpactScore が正常応答し、0-100 の波及度スコアが返される
  test('calculateIssuePriorityScore returns correct priority score with valid impact score from adapter', () => {
    const issueId = 'issue-001';
    const issueContent = 'システム全体の障害が発生しており、複数チームに影響が出ている';
    const occurrenceFrequency = 5;
    const impactScore = 68;
    const affectedTeamCount = 3;
    const resolutionDaysAverage = 2;
    const reportingDate = '2024-01-15T09:00:00Z';
    const teamId = 'team-001';

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue(['システム障害', 'データベース接続エラー', 'API遅延']),
      assessImpactScore: jest.fn().mockResolvedValue(68),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const result = calculateIssuePriorityScore(
      {
        issueId,
        issueContent,
        occurrenceFrequency,
        impactScore,
        affectedTeamCount,
        resolutionDaysAverage,
        reportingDate,
        teamId,
      },
      mockTextAnalysisServiceAdapter
    );

    expect(result).toBeDefined();
    expect(result.issueId).toBe(issueId);
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(typeof result.priorityScore).toBe('number');
    expect(result.priorityRank).toMatch(/高|中|低/);
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.colorCode).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});