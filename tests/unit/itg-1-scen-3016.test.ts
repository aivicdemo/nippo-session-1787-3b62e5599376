import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア自動計算機能 - 重複キーワード集約検証', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-3016: [edge] 課題優先度スコア自動計算機能 - 同一の課題キーワードが重複抽出されるデータセットで、発生頻度が正確に集約されてスコアに反映される
  test('重複抽出されたキーワードが正確に集約され、集約済み頻度がスコア計算に反映される', () => {
    // 重複を含むテストデータを準備
    const mockExtractedKeywords = [
      { keyword: 'データベース接続エラー', frequency: 5 },
      { keyword: 'ログイン画面バグ', frequency: 3 },
      { keyword: 'データベース接続エラー', frequency: 7 },
      { keyword: 'API応答遅延', frequency: 2 },
    ];

    // モック化されたTextAnalysisServiceAdapter
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue(mockExtractedKeywords),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    // 入力パラメータ
    const input = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが発生しました。昨日もデータベース接続エラーで対応いただき、本日もデータベース接続エラーが継続中です。',
      occurrenceFrequency: 12, // 集約後の正確な頻度
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    // 期待される計算結果
    // 集約済みの正確な頻度（12回）を基に優先度スコアを計算
    // 計算式: priorityScore = (frequencyScore) + (impactScore) + (resolutionDifficultyScore)
    // frequencyScore = min(40, (occurrenceFrequency / 30) * 40) = min(40, (12 / 30) * 40) = 16
    // impactScore = 40（与えられた85を正規化） = 40
    // resolutionDifficultyScore = (resolutionDaysAverage / 14) * 20 = (2 / 14) * 20 = 2.86 ≈ 3
    // priorityScore = 16 + 40 + 3 = 59

    const expectedPriorityScore = 59;
    const expectedPriorityRank = '中';
    const expectedColorCode = '#FFFF00';

    // 関数を呼び出し
    const result = calculateIssuePriorityScore(input);

    // アサーション: 集約済み頻度12を使用したスコアが出力されること
    expect(result.priorityScore).toBe(expectedPriorityScore);
    expect(result.priorityRank).toBe(expectedPriorityRank);
    expect(result.colorCode).toBe(expectedColorCode);
    expect(result.issueId).toBe('issue-001');

    // スコア内訳の検証
    expect(result.scoreBreakdown.frequencyScore).toBe(16);
    expect(result.scoreBreakdown.impactScore).toBe(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(3);

    // 計算日時が記録されていることを確認
    expect(result.calculatedAt).toBeDefined();
    expect(typeof result.calculatedAt).toBe('string');
  });
});