import { calculateIssuePriorityScore, type IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-1536
  test('分析対象期間の終了日が null のときエラーが発生する', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2026-01-15',
      teamId: 'team-alpha',
    };

    const mockTextAnalysisService = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    expect(() => {
      calculateIssuePriorityScore(
        input,
        mockTextAnalysisService
      );
    }).toThrow(/endDate/);
  });
});