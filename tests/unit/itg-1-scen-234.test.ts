import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('朝会報告管理システム - 優先度スコア計算エンジン', () => {
  // SCEN-234
  test('課題キーワードが空文字列のとき、InvalidIssueDataError をスロー', () => {
    const invalidInput = {
      issueId: '',
      frequency: 50,
      impactScore: 75,
    };

    expect(() => {
      calculatePriorityScoreForIssue(invalidInput);
    }).toThrow(/課題データが不完全です/);
  });
});