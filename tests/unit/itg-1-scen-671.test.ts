import { describe, test, expect } from "@jest/globals";
import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from "../../src/logic/issue-extraction-prioritization";

describe("Issue Prioritization and Colorization", () => {
  // SCEN-671: [error] 課題優先度色分け表示機能 - 色分けルール定義が undefined のとき色分けが適用されずエラーになる
  test("should handle undefined colorThresholds and throw error when applying colorization", () => {
    const issues: IssueSummary[] = [
      {
        issueId: "issue-001",
        priorityScore: 85,
        keyword: "データベース接続エラー",
        impactLevel: "high",
      },
      {
        issueId: "issue-002",
        priorityScore: 55,
        keyword: "UIレスポンス遅延",
        impactLevel: "medium",
      },
      {
        issueId: "issue-003",
        priorityScore: 25,
        keyword: "ドキュメント更新漏れ",
        impactLevel: "low",
      },
    ];

    const undefinedColorThresholds: ColorThresholdConfig | undefined =
      undefined;

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds: undefinedColorThresholds as ColorThresholdConfig,
      requestedBy: "user-001",
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/色分け/);
  });
});