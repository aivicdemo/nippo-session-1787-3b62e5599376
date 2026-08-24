import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-1062: [error] 課題影響度判定機能 - 優先度スコアが null のとき、順序付け処理がエラーになる
  test('優先度スコアが null のとき、順序付け処理でエラーが発生し、エラーハンドリングが機能する', () => {
    // Arrange
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'サーバーダウンが発生し、本番環境が利用不可',
      occurrenceFrequency: 5,
      impactScore: null as any,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    // Act & Assert
    expect(() => calculateIssuePriorityScore(input)).toThrow(/優先度スコア/);
  });
});