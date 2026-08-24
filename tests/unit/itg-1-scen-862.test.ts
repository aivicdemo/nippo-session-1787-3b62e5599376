import { describe, test, expect } from "@jest/globals";
import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from "../../src/logic/issue-extraction-prioritization";

describe("優先度の高い課題を部長向けダッシュボードで強調表示（色分け・ハイライト）する機能", () => {
  // SCEN-862: [error] ダッシュボード色分け表示機能 - 優先度レベル定義が不完全で色分けマッピングが成立しないときエラーになる
  test("優先度レベル定義が不完全な場合、エラーをスローする", () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: "issue-001",
          priorityScore: 85,
          keyword: "データベース接続タイムアウト",
          impactLevel: "high",
        },
        {
          issueId: "issue-002",
          priorityScore: 55,
          keyword: "ログ出力遅延",
          impactLevel: "medium",
        },
        {
          issueId: "issue-003",
          priorityScore: 25,
          keyword: "ドキュメント更新漏れ",
          impactLevel: "low",
        },
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: "user-001",
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(
      /PRIORITY_COLOR_MAPPING_INCOMPLETE|優先度|色定義/
    );
  });
});