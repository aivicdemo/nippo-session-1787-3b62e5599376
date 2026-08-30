import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { saveExtractedIssueData } from "../../src/logic/issue-data-persistence";

describe("saveExtractedIssueData - audit log recording failure", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-164
  test("should throw AuditLogRecordingFailure error when audit log recording fails", async () => {
    const input = {
      reportId: "rpt-001",
      issueContent: "本番環境でのパフォーマンス低下",
      issueType: "技術的課題",
      priorityScore: 85,
      impactLevel: "高",
      extractedKeywords: ["パフォーマンス", "本番環境", "低下"],
      analysisResult: undefined,
      executorId: "user-123",
    };

    expect(() => saveExtractedIssueData(input)).toThrow(/監査ログ/);
  });
});