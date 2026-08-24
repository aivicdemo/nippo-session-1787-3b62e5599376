import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput, ScoreBreakdown } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-1305: [normal] 課題影響度判定機能 - TextAnalysisServiceAdapterが正常応答した場合、影響度スコアがダッシュボードに反映される
  test('影響度スコア75が計算され、優先度スコアがダッシュボードに正しく反映される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システム障害により全チームの開発が停止',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 5,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-dev-001',
    };

    const output: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    // 戻り値の構造検証
    expect(output).toBeDefined();
    expect(output.issueId).toBe('issue-001');
    expect(output.priorityScore).toBeDefined();
    expect(typeof output.priorityScore).toBe('number');
    expect(output.priorityScore).toBeGreaterThanOrEqual(1);
    expect(output.priorityScore).toBeLessThanOrEqual(100);

    // 優先度ランクの検証（スコア75は高優先度の閾値70以上）
    expect(output.priorityRank).toBe('高');

    // 色コードの検証（高優先度は赤）
    expect(output.colorCode).toBe('#FF0000');

    // スコア内訳の検証
    expect(output.scoreBreakdown).toBeDefined();
    const breakdown: ScoreBreakdown = output.scoreBreakdown;
    
    // 発生頻度スコア: occurrenceFrequency=3 で算出（0～40の範囲）
    expect(breakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(breakdown.frequencyScore).toBeLessThanOrEqual(40);
    
    // 影響度スコア: impactScore=75 がそのまま反映（0～40の範囲に正規化）
    expect(breakdown.impactScore).toBe(30);
    
    // 解決難度スコア: resolutionDaysAverage=2 で算出（0～20の範囲）
    expect(breakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(breakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // スコア合計が優先度スコアと一致することを検証
    const calculatedTotal = breakdown.frequencyScore + breakdown.impactScore + breakdown.resolutionDifficultyScore;
    expect(output.priorityScore).toBe(Math.round(calculatedTotal));

    // 計算日時がISO 8601形式で記録されていること
    expect(output.calculatedAt).toBeDefined();
    expect(typeof output.calculatedAt).toBe('string');
    const calculatedAtDate = new Date(output.calculatedAt);
    expect(calculatedAtDate).toBeInstanceOf(Date);
    expect(calculatedAtDate.toString()).not.toBe('Invalid Date');

    // ダッシュボード表示用の検証
    expect(output.priorityScore).toBeGreaterThanOrEqual(1);
    expect(output.priorityScore).toBeLessThanOrEqual(100);
    expect(['高', '中', '低']).toContain(output.priorityRank);
    expect(['#FF0000', '#FFFF00', '#00FF00']).toContain(output.colorCode);
  });
});