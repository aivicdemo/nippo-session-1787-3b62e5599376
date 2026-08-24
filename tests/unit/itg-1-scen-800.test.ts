import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Null Keyword List Handling', () => {
  test('SCEN-800: should throw error when extracted keywords list is null', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue(null),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      issueId: 'issue-001',
      issueContent: '昨日は機能A開発、今日は機能B開発、課題として納期遅延リスクがある',
      occurrenceFrequency: 2,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    expect(() =>
      calculateIssuePriorityScore(input, mockTextAnalysisAdapter)
    ).toThrow(/抽出済み課題キーワード|null/);
  });
});