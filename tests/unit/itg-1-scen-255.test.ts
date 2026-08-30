import { calculatePriorityScoreForIssue } from "../../src/logic/priority-scoring-engine";

describe("朝会報告管理システム - 優先度スコア計算エンジン", () => {
  test("SCEN-255: チームサイズが0以下のとき、InsufficientHistoryDataError を発生させる", () => {
    const input = {
      issueId: "ISSUE-001",
      frequency: 50,
      impactScore: 60,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    expect(() => calculatePriorityScoreForIssue(input, 0)).toThrow(
      /優先度スコア計算に必要な過去30日間の課題発生履歴データが不足しています/
    );
  });
});