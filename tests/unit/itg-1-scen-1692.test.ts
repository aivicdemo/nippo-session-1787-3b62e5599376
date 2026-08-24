import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { generateWeeklyAnalysisReport } from "../../src/logic/weekly-issue-analysis";
import type {
  WeeklyAnalysisReportInput,
  ExtractedIssueData,
} from "../../src/logic/weekly-issue-analysis";

describe("Weekly Issue Analysis - Impact Score Timeout with Low Data Quality", () => {
  let mockTextAnalysisServiceAdapter: {
    assessImpactScore: jest.Mock;
  };

  let timeoutPromise: Promise<never>;

  beforeEach(() => {
    jest.clearAllMocks();

    timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("assessImpactScore timeout"));
      }, 30000);
    });

    mockTextAnalysisServiceAdapter = {
      assessImpactScore: jest.fn(async () => timeoutPromise),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1692: [error] 週次課題傾向分析レポート生成 - レコード件数は閾値以上でもデータ品質が不足し assessImpactScore がタイムアウトしたとき分析を中止しエラーを返す
  test("should abort analysis and return timeout error when assessImpactScore times out with low data quality", async () => {
    const analysisStartDate = new Date("2024-01-08T00:00:00Z");
    const analysisEndDate = new Date("2024-01-14T23:59:59Z");
    const teamId = "team-001";

    const extractedIssuesWithLowQuality: ExtractedIssueData[] = [
      {
        issueKeyword: "API呼び出しエラー",
        occurrenceCount: 3,
        impactScore: 0,
        relatedReportIds: ["report-001", "report-002", "report-003"],
      },
      {
        issueKeyword: "データベース接続タイムアウト",
        occurrenceCount: 2,
        impactScore: 0,
        relatedReportIds: ["report-004", "report-005"],
      },
      {
        issueKeyword: "メモリリーク警告",
        occurrenceCount: 1,
        impactScore: 0,
        relatedReportIds: ["report-006"],
      },
      {
        issueKeyword: "ネットワーク遅延",
        occurrenceCount: 1,
        impactScore: 0,
        relatedReportIds: ["report-007"],
      },
      {
        issueKeyword: "セッションタイムアウト",
        occurrenceCount: 1,
        impactScore: 0,
        relatedReportIds: ["report-008"],
      },
      {
        issueKeyword: "キャッシュ不一致",
        occurrenceCount: 1,
        impactScore: 0,
        relatedReportIds: ["report-009"],
      },
      {
        issueKeyword: "フォーマット解析失敗",
        occurrenceCount: 1,
        impactScore: 0,
        relatedReportIds: ["report-010"],
      },
    ];

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: "2024-01-08",
      aggregationEndDate: "2024-01-14",
      extractedIssues: extractedIssuesWithLowQuality,
      teamId: teamId,
    };

    const analysisPromise = generateWeeklyAnalysisReport(
      input,
      mockTextAnalysisServiceAdapter
    );

    await expect(analysisPromise).rejects.toThrow(/タイムアウト/);
  });
});