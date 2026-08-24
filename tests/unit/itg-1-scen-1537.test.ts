import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-1537: [edge] 課題優先度スコア算出機能 - 発生頻度がちょうど優先度判定閾値（例：週5回）で中ランクに分類される
  test('発生頻度が週5回の課題がスコア40～60の中ランクに分類される', () => {
    // 入力データ：発生頻度が週5回（閾値相当）の課題
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続がタイムアウトする',
      occurrenceFrequency: 5, // 週5回（閾値）
      impactScore: 60, // チーム波及度 60点
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    // 実行
    const result = calculateIssuePriorityScore(input);

    // 検証：優先度ランクが「中」であること
    expect(result.priorityRank).toBe('中');

    // 検証：スコア値が中ランク範囲（40～60）内であること
    expect(result.priorityScore).toBeGreaterThanOrEqual(40);
    expect(result.priorityScore).toBeLessThanOrEqual(60);

    // 検証：その他必須フィールドが含まれていること
    expect(result.issueId).toBe('issue-001');
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeDefined();
    expect(result.scoreBreakdown.impactScore).toBeDefined();
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeDefined();
    expect(result.colorCode).toBe('#FFFF00'); // 中ランクは黄色
    expect(result.calculatedAt).toBeDefined();
  });
});

interface IssuePriorityScoringInput {
  issueId: string;
  issueContent: string;
  occurrenceFrequency: number;
  impactScore: number;
  affectedTeamCount: number;
  resolutionDaysAverage: number;
  reportingDate: string;
  teamId: string;
}