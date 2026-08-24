import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-846
  test('チームIDが欠落している状態で影響度判定を実行したときエラーになる', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(async () => ({
        impactScore: 75,
        affectedTeamCount: 3,
      })),
      classifyIssueSeverity: jest.fn(),
    };

    const inputWithoutTeamId: Partial<IssuePriorityScoringInput> = {
      issueId: 'ISSUE-001',
      issueContent: 'Database performance degradation affecting multiple services',
      occurrenceFrequency: 5,
      impactScore: undefined,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: '', // 空文字列でチームIDを欠落させる
    };

    expect(() =>
      calculateIssuePriorityScore(inputWithoutTeamId as IssuePriorityScoringInput, mockTextAnalysisServiceAdapter)
    ).toThrow(/チームID/);
  });
});