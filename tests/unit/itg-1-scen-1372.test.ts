import { extractAndRankIssueKeywords } from "../../src/logic/issue-analysis";
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from "../../src/logic/issue-analysis";

describe("課題の影響度判定と優先度付け機能", () => {
  // SCEN-1372: [error] 重複課題統合・優先度再計算機能 - 子課題リストが null のとき統合処理が失敗する
  test("子課題リストが null のとき、統合処理は TypeError を発生させる", () => {
    const input: ExtractIssueKeywordsInput = {
      reportDataList: [
        {
          id: "report-001",
          createdAt: "2024-01-15T09:00:00Z",
          teamId: "team-001",
          userId: "user-001",
          yesterdayAccomplishment: "システムの日報機能を実装完了",
          todayPlan: "テスト環境での動作確認を実施",
          challenge: "メモリ使用量が想定より増加している課題が発生",
          issueChallengeText: "メモリ使用量が想定より増加している課題が発生",
        },
      ],
      analysisStartDate: "2024-01-08T00:00:00Z",
      analysisEndDate: "2024-01-15T23:59:59Z",
      minFrequencyThreshold: 1,
    };

    expect(() => {
      extractAndRankIssueKeywords(input);
    }).toThrow(/子課題リスト/);
  });
});