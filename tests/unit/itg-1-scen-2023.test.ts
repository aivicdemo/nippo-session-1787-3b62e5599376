import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('朝会報告管理システム - 課題優先度スコア計算', () => {
  // SCEN-2023: [normal] 複数対策案の承認フロー - 0件の対策案登録時、承認フローは開始されない
  test('対策案が0件の場合、承認フローは開始されず通知も送信されない', () => {
    // Arrange: 対策案0件のシナリオでの入力データ
    const issueInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが頻発している',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-dev-001',
    };

    // Act: 優先度スコア計算処理を実行
    const result = calculateIssuePriorityScore(issueInput);

    // Assert: 期待結果の検証
    // 発生頻度スコア: min(5 * 8, 40) = 40
    // 影響度スコア: (75 / 100) * 40 = 30
    // 解決難度スコア: (1 / 2.5) * 20 = 8
    // 合計: 40 + 30 + 8 = 78
    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(78);
    expect(result.priorityRank).toBe('高');
    expect(result.scoreBreakdown.frequencyScore).toBe(40);
    expect(result.scoreBreakdown.impactScore).toBe(30);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(8);
    expect(result.colorCode).toBe('#FF0000');
    expect(result.calculatedAt).toBeDefined();
  });
});