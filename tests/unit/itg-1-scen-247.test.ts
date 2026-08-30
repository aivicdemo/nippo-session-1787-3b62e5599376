import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  // SCEN-247: [edge] 課題の発生頻度と影響度から優先度スコア（0～100）を計算し、優先度ランク（高・中・低）を判定して返す。 - 最大発生回数が0のときという明示された境界条件で正規化基準値が無効です。デフォルト値を使用します
  test('should calculate priority score with default weights when max frequency is zero', () => {
    // Given: calculatePriorityScoreForIssue関数に対して
    // issueId: 'ISSUE-001'
    // frequency: 25（過去30日間の正規化値）
    // impactScore: 60
    // frequencyWeight: 未設定（デフォルト0.4を期待）
    // impactWeight: 未設定（デフォルト0.6を期待）
    const issueId = 'ISSUE-001';
    const frequency = 25;
    const impactScore = 60;

    // When: 関数を実行する
    const result = calculatePriorityScoreForIssue({
      issueId,
      frequency,
      impactScore,
    });

    // Then: 戻り値のIssuePriorityScore型が以下の値を持つこと
    // 計算式: (25 * 0.4) + (60 * 0.6) = 10 + 36 = 46
    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityScore).toBe(46);
    expect(result.priorityRank).toBe('MEDIUM');
    expect(result.colorCode).toBe('YELLOW');
  });
});