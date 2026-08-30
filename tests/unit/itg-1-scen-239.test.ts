import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  test('SCEN-239: throw InvalidIssueDataError when frequency is negative', () => {
    // SCEN-239: [error] 課題の発生頻度と影響度から優先度スコア（0～100）を計算し、優先度ランク（高・中・低）を判定して返す。 - 発生頻度がマイナス値のときという明示された境界条件で課題の発生回数が不正な値です

    const input = {
      issueId: 'ISSUE-001',
      frequency: -5,
      impactScore: 50,
    };

    expect(() => calculatePriorityScoreForIssue(input)).toThrow(/発生頻度/);
  });
});