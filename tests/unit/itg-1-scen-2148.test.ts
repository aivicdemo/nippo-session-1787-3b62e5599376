import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア順序付け表示機能', () => {
  // SCEN-2148: [normal] 課題優先度スコア算出機能 - 外部サービス TextAnalysisServiceAdapter が正常応答した場合、抽出キーワードと影響度スコアが正確に取得され優先度計算に反映される
  test('TextAnalysisServiceAdapter が正常応答し、抽出キーワードと影響度スコアが優先度計算に反映される', async () => {
    // Arrange: TextAnalysisServiceAdapter のスタブを準備
    const textAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'データベース接続エラー', frequency: 3 },
        { keyword: 'APIタイムアウト', frequency: 2 }
      ]),
      assessImpactScore: jest.fn()
        .mockResolvedValueOnce(75) // 『データベース接続エラー』→ 75
        .mockResolvedValueOnce(50)  // 『APIタイムアウト』→ 50
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: '昨日はデータベース接続エラーで業務が停止。今日も対応予定。データベース接続エラーの原因調査とAPIタイムアウト対応を進める。',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    // Act: 課題優先度スコア算出機能を実行
    const result = await calculateIssuePriorityScore(input, textAnalysisServiceAdapter);

    // Assert: TextAnalysisServiceAdapter の extractKeywords と assessImpactScore が各 1 回ずつ呼び出されたことを検証
    expect(textAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(1);
    expect(textAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(2);

    // Assert: 算出された優先度スコアが (3 × 75 + 2 × 50) / (3 + 2) = 65 として算出されることを検証
    // 期待値: (3 × 75 + 2 × 50) / (3 + 2) = (225 + 100) / 5 = 325 / 5 = 65
    expect(result.priorityScore).toBe(65);

    // Assert: 優先度ランクが正しく判定されることを検証（スコア 65 は中優先度）
    expect(result.priorityRank).toBe('中');

    // Assert: スコア計算の内訳が正確に記録されていることを検証
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThan(0);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThan(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);

    // Assert: 色コードが正しく設定されていることを検証（中優先度は黄色）
    expect(result.colorCode).toBe('#FFFF00');

    // Assert: 計算実行日時が ISO 8601 形式で記録されていることを検証
    expect(typeof result.calculatedAt).toBe('string');
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);

    // Assert: 課題ID が返却結果に含まれていることを検証
    expect(result.issueId).toBe('issue-001');
  });
});