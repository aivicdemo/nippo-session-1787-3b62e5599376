import { describe, it, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  it('SCEN-737: [normal] 課題の自動抽出と優先度判定機能 - 日報が1件のときに抽出された課題が1件の一覧で返却される', () => {
    // 準備：テスト用日報データ1件
    const testInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが発生',
      occurrenceFrequency: 1,
      impactScore: 75,
      affectedTeamCount: 1,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    // 実行：課題の優先度スコアを計算
    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(testInput);

    // 検証：戻り値の内容を確認
    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(65);
    expect(result.priorityRank).toBe('中');
    expect(result.scoreBreakdown.frequencyScore).toBe(25);
    expect(result.scoreBreakdown.impactScore).toBe(30);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(10);
    expect(result.colorCode).toBe('#FFFF00');
    expect(typeof result.calculatedAt).toBe('string');
  });
});