import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  // SCEN-1061
  test('チーム波及度スコアが100を超える場合、エラーを返す', () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockResolvedValue(101),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      issueId: 'issue-001',
      issueContent: 'サーバーダウン',
      occurrenceFrequency: 5,
      impactScore: 101,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-001',
    };

    expect(() => {
      calculateIssuePriorityScore(input, mockTextAnalysisService);
    }).toThrow(/チーム波及度スコア/);
  });
});