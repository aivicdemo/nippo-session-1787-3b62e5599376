import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('朝会報告管理システム - 優先度スコア計算エンジン', () => {
  // SCEN-334: [error] 課題の発生頻度と影響度から優先度スコア（0～100）を計算し、優先度ランク（高・中・低）を判定して返す。 - 影響を受けるメンバー数がチーム全体の人数を超えるときという明示された境界条件で影響メンバー数がチーム規模を超えています
  test('影響を受けるメンバー数がチーム全体の人数を超えるときはエラーを発生させる', () => {
    const issueKeyword = 'ビルドエラー';
    const occurrenceCount = 3;
    const affectedMemberCount = 11;
    const teamSize = 10;
    const issueCategory = 'technical_failure';

    expect(() =>
      calculatePriorityScoreForIssue(
        issueKeyword,
        occurrenceCount,
        affectedMemberCount,
        teamSize,
        issueCategory
      )
    ).toThrow(/影響メンバー数がチーム規模を超えています/);
  });
});