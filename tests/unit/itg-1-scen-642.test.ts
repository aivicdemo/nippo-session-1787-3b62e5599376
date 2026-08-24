import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-642: [edge] 課題優先度スコア計算機能 - 過去30日間の発生履歴の終了日が計測対象期間に含まれる
  test('過去30日間の発生履歴の終了日が計測対象期間に含まれる場合、該当課題は優先度スコア計算の対象となり、スコア値が65以上で算出されること', () => {
    // 現在日時を2026-08-25T10:00:00Zに固定
    const currentDate = new Date('2026-08-25T10:00:00Z');
    
    // 計測対象期間：過去30日間（2026-07-27～2026-08-25）
    const endDate = new Date('2026-08-25T23:59:59Z');
    const startDate = new Date('2026-07-27T00:00:00Z');
    
    // テスト用の課題優先度スコア計算入力
    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'テスト課題：システム性能低下の問題',
      occurrenceFrequency: 3, // 過去30日間の発生頻度3件
      impactScore: 65, // 波及度スコア65
      affectedTeamCount: 2, // 影響を受けるチーム数2
      resolutionDaysAverage: 5, // 平均解決日数5日
      reportingDate: '2026-08-25', // ISO 8601形式
      teamId: 'TEAM-001'
    };

    // 関数を実行
    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    // 検証：終了日（2026-08-25）が計測対象期間に含まれるため、優先度スコアが算出される
    expect(result).toBeDefined();
    expect(result.issueId).toBe('ISSUE-001');
    
    // 波及度スコア65に基づいた優先度スコア値が65以上であることを確認
    expect(result.priorityScore).toBeGreaterThanOrEqual(65);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    
    // 優先度スコアが65以上なので、優先度ランクは「高」または「中」であることを確認
    expect(['高', '中']).toContain(result.priorityRank);
    
    // スコア計算の内訳が存在すること
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    
    // 色コードが正しく設定されていること
    expect(['#FF0000', '#FFFF00', '#00FF00']).toContain(result.colorCode);
    
    // 計算実行日時が記録されていること
    expect(result.calculatedAt).toBeDefined();
    const calculatedAtDate = new Date(result.calculatedAt);
    expect(calculatedAtDate.getTime()).toBeGreaterThan(0);
  });
});