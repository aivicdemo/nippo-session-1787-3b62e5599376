import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-945
  test('優先度スコアが100を超える値のとき色分けロジックがエラーを返す', () => {
    const mockTextAnalysisServiceAdapter = {
      assessImpactScore: jest.fn().mockReturnValue(101),
      extractKeywords: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続タイムアウトが頻発している',
      occurrenceFrequency: 15,
      impactScore: 101,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-dev-001',
    };

    expect(() =>
      calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter)
    ).toThrow(/優先度スコア/);
  });
});