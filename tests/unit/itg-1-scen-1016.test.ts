import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定機能', () => {
  // SCEN-1016
  test('同じ課題キーワード群で2回影響度判定を実行した場合、同じスコアと順序が返される', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn((keyword: string) => {
        const scoreMap: Record<string, number> = {
          'データベース接続エラー': 85,
          'APIタイムアウト': 72,
          'ログイン機能': 60,
        };
        return scoreMap[keyword] ?? 50;
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const issueInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが頻発している',
      occurrenceFrequency: 15,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-alpha',
    };

    const scoreResult1 = calculateIssuePriorityScore(issueInput, mockTextAnalysisServiceAdapter);

    const scoreResult2 = calculateIssuePriorityScore(issueInput, mockTextAnalysisServiceAdapter);

    expect(scoreResult1.issueId).toBe('issue-001');
    expect(scoreResult2.issueId).toBe('issue-001');

    expect(scoreResult1.priorityScore).toBe(scoreResult2.priorityScore);
    expect(scoreResult1.priorityRank).toBe(scoreResult2.priorityRank);
    expect(scoreResult1.scoreBreakdown.frequencyScore).toBe(scoreResult2.scoreBreakdown.frequencyScore);
    expect(scoreResult1.scoreBreakdown.impactScore).toBe(scoreResult2.scoreBreakdown.impactScore);
    expect(scoreResult1.scoreBreakdown.resolutionDifficultyScore).toBe(
      scoreResult2.scoreBreakdown.resolutionDifficultyScore
    );
    expect(scoreResult1.colorCode).toBe(scoreResult2.colorCode);
  });
});