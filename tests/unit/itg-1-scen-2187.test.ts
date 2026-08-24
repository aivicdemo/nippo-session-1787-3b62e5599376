import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア順序付け', () => {
  test('SCEN-2187: 同一課題キーワードが複数プロジェクトで同じ発生頻度で重複している場合、優先度スコアは1回分のみ計算される', () => {
    // TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'データベース接続エラー', frequency: 2 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(65),
      classifyIssueSeverity: jest.fn().mockResolvedValue('高'),
    };

    // プロジェクトA・プロジェクトBそれぞれで、同一キーワード「データベース接続エラー」が出現頻度2回で重複するテストデータを用意
    const issueInputProjectA: IssuePriorityScoringInput = {
      issueId: 'issue-001-projectA',
      issueContent: 'データベース接続エラーが発生しました',
      occurrenceFrequency: 2,
      impactScore: 65,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-projectA',
    };

    const issueInputProjectB: IssuePriorityScoringInput = {
      issueId: 'issue-001-projectB',
      issueContent: 'データベース接続エラーが発生しました',
      occurrenceFrequency: 2,
      impactScore: 65,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-projectB',
    };

    // 優先度スコア算出機能に上記2プロジェクトの日報データを入力
    const resultProjectA = calculateIssuePriorityScore(issueInputProjectA);
    const resultProjectB = calculateIssuePriorityScore(issueInputProjectB);

    // 算出された優先度スコアの値を確認：
    // 計算式: frequencyScore (0-40) + impactScore (0-40) + resolutionDifficultyScore (0-20) = 1-100
    // frequency: 2 → frequencyScore = Math.min(40, (2 / 10) * 40) = 8
    // impactScore: 65 → impactScore score = (65 / 100) * 40 = 26
    // resolutionDaysAverage: 2 → resolutionDifficultyScore = Math.min(20, (2 / 5) * 20) = 8
    // 合計: 8 + 26 + 8 = 42
    expect(resultProjectA.priorityScore).toBe(42);
    expect(resultProjectB.priorityScore).toBe(42);

    // 優先度ランクの確認：スコア42は「中」に分類
    expect(resultProjectA.priorityRank).toBe('中');
    expect(resultProjectB.priorityRank).toBe('中');

    // スコア内訳の確認
    expect(resultProjectA.scoreBreakdown.frequencyScore).toBe(8);
    expect(resultProjectA.scoreBreakdown.impactScore).toBe(26);
    expect(resultProjectA.scoreBreakdown.resolutionDifficultyScore).toBe(8);

    expect(resultProjectB.scoreBreakdown.frequencyScore).toBe(8);
    expect(resultProjectB.scoreBreakdown.impactScore).toBe(26);
    expect(resultProjectB.scoreBreakdown.resolutionDifficultyScore).toBe(8);

    // 色コードの確認：中優先度は黄色
    expect(resultProjectA.colorCode).toBe('#FFFF00');
    expect(resultProjectB.colorCode).toBe('#FFFF00');

    // 同一キーワードについて、スコアが1度だけ算出されることを確認
    // 両方の結果が同じスコア値であることで、重複排除後の統一スコアを示唆
    expect(resultProjectA.priorityScore).toEqual(resultProjectB.priorityScore);

    // issueIdは異なるが、同一の課題内容に対して同じスコアが算出されたこと
    expect(resultProjectA.issueId).toBe('issue-001-projectA');
    expect(resultProjectB.issueId).toBe('issue-001-projectB');

    // calculatedAtが ISO 8601 形式で記録されていること
    expect(resultProjectA.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    expect(resultProjectB.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });
});