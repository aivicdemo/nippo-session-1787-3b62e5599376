import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('朝会報告管理システム - 優先度スコア計算エンジン', () => {
  // SCEN-238: [error] 課題の発生頻度と影響度から優先度スコア（0～100）を計算し、優先度ランク（高・中・低）を判定して返す。 - チームサイズが0以下のときという明示された境界条件でチームサイズの設定が不正です
  test('チームサイズが0以下の場合、課題データが不完全なエラーを発生させる', () => {
    const input = {
      issueId: 'issue-001',
      frequency: 50,
      impactScore: 75,
    };

    expect(() => calculatePriorityScoreForIssue(input)).toThrow(/課題データが不完全/);
  });
});