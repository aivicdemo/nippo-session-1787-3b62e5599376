import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation with Null Keywords', () => {
  // SCEN-2975
  test('should throw error when extracted keywords array is null', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue(null),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      issueId: 'issue-001',
      issueContent: '昨日は機能A開発。今日は機能B開発予定。課題：ネットワーク遅延が発生',
      occurrenceFrequency: 2,
      impactScore: 65,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-001',
    };

    await expect(
      calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter)
    ).rejects.toThrow(/課題キーワード/);
  });
});