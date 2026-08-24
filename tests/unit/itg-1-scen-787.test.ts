import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-787
  test('本日の報告に新規キーワードが1件含まれる場合、過去実績なしでも現在の影響度で優先度スコアが算出される', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          {
            keyword: 'データベース障害',
            frequency: 1,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockReturnValue(75),
      classifyIssueSeverity: jest.fn().mockReturnValue('high'),
    };

    const reportingDate = '2024-01-15T09:00:00Z';
    const issueContent = 'データベース障害が発生している';
    const occurrenceFrequency = 1;
    const impactScore = 75;
    const affectedTeamCount = 1;
    const resolutionDaysAverage = 0;
    const teamId = 'team-001';

    const input = {
      issueId: 'issue-001',
      issueContent: issueContent,
      occurrenceFrequency: occurrenceFrequency,
      impactScore: impactScore,
      affectedTeamCount: affectedTeamCount,
      resolutionDaysAverage: resolutionDaysAverage,
      reportingDate: reportingDate,
      teamId: teamId,
    };

    const result = calculateIssuePriorityScore(input, mockTextAnalysisAdapter);

    expect(result.priorityScore).toBe(75);
    expect(result.issueId).toBe('issue-001');
    expect(result.priorityRank).toBe('高');
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.impactScore).toBe(75);
    expect(result.colorCode).toBe('#FF0000');
    expect(result.calculatedAt).toBeDefined();
  });
});