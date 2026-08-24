import { calculateIssuePriorityScore, type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  // SCEN-582: [error] 課題優先度判定機能 - チームIDがnullのとき優先度判定エラーが発生する
  test('チームIDがnullの場合、エラーを発生させて外部サービスを呼び出さない', () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const inputWithNullTeamId: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが頻発している',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: null as any,
    };

    expect(() => {
      calculateIssuePriorityScore(inputWithNullTeamId, mockTextAnalysisService);
    }).toThrow(/チームID/);

    expect(mockTextAnalysisService.assessImpactScore).not.toHaveBeenCalled();
  });
});