import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('朝会報告管理システム - 優先度スコア計算エンジン', () => {
  // SCEN-348: [error] ハイライト対象パーセンタイルが0未満のときは境界値エラーを投げる
  test('ハイライト対象パーセンタイルが0未満のときエラーを投げる', () => {
    const issueList = [
      {
        issueKeyword: 'ビルドエラー',
        occurrenceCount: 8,
        affectedMemberCount: 6,
        reportedDate: '2024-01-15',
      },
      {
        issueKeyword: 'テスト失敗',
        occurrenceCount: 5,
        affectedMemberCount: 3,
        reportedDate: '2024-01-15',
      },
    ];
    const teamSize = 10;
    const historicalIssueData = [
      {
        issueKeyword: 'ビルドエラー',
        resolutionDays: 2,
        recurringCount: 3,
      },
      {
        issueKeyword: 'テスト失敗',
        resolutionDays: 1,
        recurringCount: 1,
      },
    ];
    const frequencyWeight = 0.4;
    const impactWeight = 0.6;
    const highlightThresholdPercentile = -1;

    expect(() =>
      calculatePriorityScoreForIssue(
        issueList,
        teamSize,
        historicalIssueData,
        frequencyWeight,
        impactWeight,
        highlightThresholdPercentile
      )
    ).toThrow(/パーセンタイル/);
  });
});