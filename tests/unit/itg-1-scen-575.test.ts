import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の優先度スコア計算機能', () => {
  test('SCEN-575: チーム波及度スコアが101のとき無効な入力エラーが発生する', () => {
    // Arrange: 無効なチーム波及度スコア（101）を含む入力データ
    const invalidInput = {
      issueId: 'issue-001',
      issueContent: 'システムの応答時間が遅い',
      occurrenceFrequency: 5,
      impactScore: 101, // 有効範囲外（0-100を超える）
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    // Act & Assert: チーム波及度スコアが範囲外の場合、エラーが発生する
    expect(() => calculateIssuePriorityScore(invalidInput)).toThrow(/チーム波及度スコアは0～100の範囲/);
  });
});