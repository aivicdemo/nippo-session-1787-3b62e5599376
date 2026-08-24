import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の優先度スコア計算 - チーム情報が不正な場合', () => {
  // SCEN-3005
  test('チーム情報が null のとき、チーム波及度スコア計算がエラーになる', () => {
    const mockTextAnalysisAdapter = {
      assessImpactScore: jest.fn((keyword: string, team: any) => {
        if (team === null) {
          throw new TypeError('team parameter is required');
        }
        return 75;
      }),
    };

    const issuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 5,
      impactScore: 0,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'TEAM-001',
    };

    const teamInfo = null;

    expect(() => {
      calculateIssuePriorityScore(
        issuePriorityScoringInput,
        mockTextAnalysisAdapter,
        teamInfo
      );
    }).toThrow(/team/);
  });
});