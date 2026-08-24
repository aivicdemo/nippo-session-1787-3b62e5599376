import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  // SCEN-1126: [normal] 課題の優先度スコア算出機能 - 影響度スコアが低い課題は優先度スコアが低く算出される
  test('影響度スコアが低い課題は優先度スコアが低く算出される', () => {
    // 影響度スコア20（低い値）の課題入力データ
    const lowImpactInput: IssuePriorityScoringInput = {
      issueId: 'issue-001-low-impact',
      issueContent: 'マイナーなUIの表示バグ',
      occurrenceFrequency: 2,
      impactScore: 20,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-01'
    };

    // 影響度スコア80（高い値）の課題入力データ（比較対象）
    const highImpactInput: IssuePriorityScoringInput = {
      issueId: 'issue-002-high-impact',
      issueContent: '本番環境でのデータベース接続エラー',
      occurrenceFrequency: 2,
      impactScore: 80,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-01'
    };

    // 低影響度課題の優先度スコアを算出
    const lowImpactResult: IssuePriorityScoringOutput = calculateIssuePriorityScore(lowImpactInput);

    // 高影響度課題の優先度スコアを算出
    const highImpactResult: IssuePriorityScoringOutput = calculateIssuePriorityScore(highImpactInput);

    // 影響度スコアが20（低い）の課題の優先度スコアが50以下であることを検証
    expect(lowImpactResult.priorityScore).toBeLessThanOrEqual(50);

    // 高影響度課題の優先度スコアが低影響度課題より明確に高いことを検証
    expect(highImpactResult.priorityScore).toBeGreaterThan(lowImpactResult.priorityScore);

    // 低影響度課題は「低」優先度ランク、高影響度課題は「中」または「高」優先度ランクであることを検証
    expect(lowImpactResult.priorityRank).toBe('低');
    expect(['中', '高']).toContain(highImpactResult.priorityRank);

    // スコア計算の内訳が正しく返却されることを検証
    expect(lowImpactResult.scoreBreakdown).toBeDefined();
    expect(lowImpactResult.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(lowImpactResult.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(lowImpactResult.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(lowImpactResult.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(lowImpactResult.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(lowImpactResult.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // 色コードが正しく設定されることを検証（低優先度は緑）
    expect(lowImpactResult.colorCode).toBe('#00FF00');

    // 計算実行日時がISO 8601形式で記録されることを検証
    expect(lowImpactResult.calculatedAt).toBeDefined();
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(lowImpactResult.calculatedAt)).toBe(true);
  });
});