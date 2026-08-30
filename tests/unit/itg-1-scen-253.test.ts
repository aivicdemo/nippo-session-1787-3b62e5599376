import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  // SCEN-253: [edge] 課題の発生頻度と影響度から優先度スコア（0～100）を計算し、優先度ランク（高・中・低）を判定して返す。 - 課題キーワードが空文字列または null のときという明示された境界条件で無効な課題キーワードをスキップします
  test('should throw InvalidIssueDataError when issueId is empty string', () => {
    const input = {
      issueId: '',
      frequency: 50,
      impactScore: 75,
    };

    expect(() => calculatePriorityScoreForIssue(input)).toThrow(/課題データが不完全/);
  });
});