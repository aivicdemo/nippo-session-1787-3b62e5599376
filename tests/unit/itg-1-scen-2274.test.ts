import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type TextAnalysisServiceAdapter } from '../../src/adapters/text-analysis-service-adapter';

describe('Issue Priority Scoring with TextAnalysisServiceAdapter', () => {
  // SCEN-2274: [normal] TextAnalysisServiceAdapter連携 - assessImpactScore呼び出しが正常応答した場合、キーワードに対するチーム波及度スコアが返される
  test('calculateIssuePriorityScore returns priority score with impact assessment from TextAnalysisServiceAdapter', async () => {
    const mockTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'データベース障害', impactScore: 85 },
          { keyword: 'API連携遅延', impactScore: 62 },
        ],
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      issueId: 'ISSUE-001',
      issueContent: 'データベース障害とAPI連携遅延が発生している',
      occurrenceFrequency: 5,
      impactScore: 80,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-A',
    };

    const result = await calculateIssuePriorityScore(input, mockTextAnalysisAdapter);

    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.priorityRank).toMatch(/^(高|中|低)$/);
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/);
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
  });
});