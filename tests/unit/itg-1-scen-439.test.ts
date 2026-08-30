import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { extractAndRankIssuesFromReports } from "../../src/logic/issue-extraction-and-ranking";
import type {
  ExtractAndRankIssuesInput,
  RankedIssueList,
  RankedIssue,
  Report,
} from "../../src/logic/issue-extraction-and-ranking";

describe("Issue Extraction and Ranking", () => {
  // SCEN-439: 複数の日報から課題キーワードを自動抽出し、発生頻度と影響度に基づいて優先度スコアを計算して、優先度別に順序付けされた課題一覧を生成する。 - 課題記述が空または100文字を超えるときという明示された境界条件で不正な課題記述はスキップされます
  test("should skip invalid issue descriptions (empty or exceeds 100 characters) and return ranked issues from valid reports only", () => {
    // 入力データ構築
    const emptyIssueReport: Report = {
      reportId: "report-001",
      reportDate: new Date("2024-01-15T09:00:00Z"),
      issueText: "",
      teamId: "team-001",
    };

    const oversizedIssueReport: Report = {
      reportId: "report-002",
      reportDate: new Date("2024-01-15T09:00:00Z"),
      issueText: "a".repeat(101),
      teamId: "team-001",
    };

    const validIssueReport: Report = {
      reportId: "report-003",
      reportDate: new Date("2024-01-15T09:00:00Z"),
      issueText: "This is a valid issue description with approximately fifty characters",
      teamId: "team-001",
    };

    const input: ExtractAndRankIssuesInput = {
      reports: [emptyIssueReport, oversizedIssueReport, validIssueReport],
      analysisStartDate: new Date("2023-12-15T00:00:00Z"),
      analysisEndDate: new Date("2024-01-15T23:59:59Z"),
      teamIds: ["team-001"],
      minimumConfidenceThreshold: 50,
    };

    // スタブの設定
    const extractKeywordsFromReportTextMock = jest.fn(
      (text: string, _teamId: string) => {
        if (text === validIssueReport.issueText) {
          return [
            {
              keywordId: "kw-001",
              keywordName: "issue",
              matchedText: "issue",
              matchCount: 1,
            },
          ];
        }
        return [];
      }
    );

    const normalizeAndDeduplicateIssuesMock = jest.fn((issues: any[]) => ({
      normalizedIssues: issues,
      deduplicationSummary: {
        originalCount: issues.length,
        mergedCount: 0,
        finalCount: issues.length,
      },
    }));

    const calculateIssueFrequencyRankingMock = jest.fn(() => ({
      rankedKeywords: [
        {
          keywordId: "kw-001",
          keywordName: "issue",
          occurrenceCount: 1,
          frequencyRank: 1,
        },
      ],
      aggregationPeriod: {
        startDate: new Date("2023-12-15T00:00:00Z"),
        endDate: new Date("2024-01-15T23:59:59Z"),
      },
      totalReportsAnalyzed: 1,
    }));

    const combineFrequencyAndImpactForPriorityMock = jest.fn(
      (rankedKeywords: any[]) => {
        return rankedKeywords.map((kw: any) => ({
          ...kw,
          impactScore: 50,
        }));
      }
    );

    const calculatePriorityScoreForIssueMock = jest.fn(
      (frequency: number, impactScore: number) => {
        return frequency * 40 + impactScore * 60;
      }
    );

    const applyPriorityColorCodingMock = jest.fn((issue: any) => ({
      ...issue,
      priorityScore: issue.priorityScore,
      priorityRank:
        issue.priorityScore >= 70
          ? "高"
          : issue.priorityScore >= 40
            ? "中"
            : "低",
      colorCode:
        issue.priorityScore >= 70
          ? "red"
          : issue.priorityScore >= 40
            ? "yellow"
            : "green",
    }));

    // 関数呼び出し
    const result: RankedIssueList = extractAndRankIssuesFromReports(input);

    // 検証：issues 配列が有効な課題のみで構成されていることを確認
    expect(result.issues).toBeDefined();
    expect(Array.isArray(result.issues)).toBe(true);

    // 検証：totalIssueCount がスキップされた2件を除いたカウント値であることを確認
    expect(result.totalIssueCount).toBe(1);

    // 検証：analysisTimestamp が定義されていることを確認
    expect(result.analysisTimestamp).toBeInstanceOf(Date);

    // 検証：issues 配列に含まれるのが有効な課題からのみ抽出されたキーワードであることを確認
    if (result.issues.length > 0) {
      const firstIssue: RankedIssue = result.issues[0];
      expect(firstIssue.keyword).toBe("issue");
      expect(firstIssue.frequency).toBe(1);
      expect(firstIssue.impactScore).toBeGreaterThanOrEqual(0);
      expect(firstIssue.impactScore).toBeLessThanOrEqual(100);
      expect(firstIssue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(firstIssue.priorityScore).toBeLessThanOrEqual(100);
    }

    // 検証：lowConfidenceIssueCount が正しく設定されていることを確認
    expect(result.lowConfidenceIssueCount).toBeGreaterThanOrEqual(0);
  });
});