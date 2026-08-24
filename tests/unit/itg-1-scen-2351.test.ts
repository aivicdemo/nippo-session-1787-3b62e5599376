import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";

describe("朝会報告集約分析機能", () => {
  test("SCEN-2351: 複数日報から同一課題キーワードが抽出される場合、発生頻度を正確に集計する", () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const reportA = {
      reportId: "report-001",
      teamId: "team-dev",
      submittedAt: new Date("2026-01-20T09:00:00Z"),
      yesterdayAccomplishment: "API実装完了",
      todayPlan: "テスト実施",
      issueDescription: "APIの応答遅延が発生、ネットワーク接続不安定",
    };

    const reportB = {
      reportId: "report-002",
      teamId: "team-dev",
      submittedAt: new Date("2026-01-21T09:00:00Z"),
      yesterdayAccomplishment: "テスト完了",
      todayPlan: "デプロイ準備",
      issueDescription: "APIの応答遅延が再発、データベース接続タイムアウト",
    };

    const reportC = {
      reportId: "report-003",
      teamId: "team-dev",
      submittedAt: new Date("2026-01-22T09:00:00Z"),
      yesterdayAccomplishment: "デプロイ完了",
      todayPlan: "監視実施",
      issueDescription: "ネットワーク接続不安定、キャッシュ容量不足",
    };

    mockTextAnalysisAdapter.extractKeywords
      .mockReturnValueOnce({
        keywords: [
          { keyword: "APIの応答遅延", frequency: 1 },
          { keyword: "ネットワーク接続不安定", frequency: 1 },
        ],
      })
      .mockReturnValueOnce({
        keywords: [
          { keyword: "APIの応答遅延", frequency: 1 },
          { keyword: "データベース接続タイムアウト", frequency: 1 },
        ],
      })
      .mockReturnValueOnce({
        keywords: [
          { keyword: "ネットワーク接続不安定", frequency: 1 },
          { keyword: "キャッシュ容量不足", frequency: 1 },
        ],
      });

    const reports = [reportA, reportB, reportC];

    const result = extractMonthlyReportData(
      {
        targetYear: 2026,
        targetMonth: 1,
        requestedByUserId: "user-pm-001",
      },
      mockTextAnalysisAdapter,
      reports
    );

    expect(result.totalReportCount).toBe(3);

    const keywordFrequencies: { [keyword: string]: number } = {};
    for (const report of reports) {
      const extracted = mockTextAnalysisAdapter.extractKeywords(
        report.issueDescription
      );
      for (const kw of extracted.keywords) {
        keywordFrequencies[kw.keyword] =
          (keywordFrequencies[kw.keyword] || 0) + kw.frequency;
      }
    }

    expect(keywordFrequencies["APIの応答遅延"]).toBe(2);
    expect(keywordFrequencies["ネットワーク接続不安定"]).toBe(2);
    expect(keywordFrequencies["データベース接続タイムアウト"]).toBe(1);
    expect(keywordFrequencies["キャッシュ容量不足"]).toBe(1);

    const sortedKeywords = Object.entries(keywordFrequencies)
      .sort(([, freqA], [, freqB]) => freqB - freqA)
      .map(([keyword, frequency]) => ({ keyword, frequency }));

    expect(sortedKeywords[0]).toEqual({
      keyword: "APIの応答遅延",
      frequency: 2,
    });
    expect(sortedKeywords[1]).toEqual({
      keyword: "ネットワーク接続不安定",
      frequency: 2,
    });
    expect(sortedKeywords[2]).toEqual({
      keyword: "データベース接続タイムアウト",
      frequency: 1,
    });
    expect(sortedKeywords[3]).toEqual({
      keyword: "キャッシュ容量不足",
      frequency: 1,
    });

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(3);
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      reportA.issueDescription
    );
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      reportB.issueDescription
    );
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      reportC.issueDescription
    );
  });
});