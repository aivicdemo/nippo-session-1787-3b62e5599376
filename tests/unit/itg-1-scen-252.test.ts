import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('朝会報告管理システム - 優先度スコア計算エンジン', () => {
  // SCEN-252
  test('課題の発生頻度が0で過去30日間のデータがない場合、InsufficientHistoryDataErrorをスロー', () => {
    const input = {
      issueId: 'issue-001',
      frequency: 0,
      impactScore: 50,
    };

    expect(() => calculatePriorityScoreForIssue(input)).toThrow(/過去30日間/);
  });
});