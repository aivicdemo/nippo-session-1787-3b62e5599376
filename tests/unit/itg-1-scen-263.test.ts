import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('優先度スコア計算エンジン', () => {
  test('SCEN-263: 課題キーワードが空のときエラーを発生させる', () => {
    const invalidInput = {
      issueId: '',
      frequency: 50,
      impactScore: 75,
    };

    expect(() => calculatePriorityScoreForIssue(invalidInput)).toThrow(/課題データが不完全です。発生頻度と影響度スコアが必須です。/);
  });
});