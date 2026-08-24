import { describe, test, expect, beforeEach } from "@jest/globals";
import { extractWeeklyReportData } from "../../src/logic/weekly-issue-analysis";
import type { WeeklyExtractionRequest, WeeklyReportDataset } from "../../src/logic/weekly-issue-analysis";

describe("Weekly Issue Analysis - Extract Weekly Report Data", () => {
  // SCEN-1702
  test("should process single day dataset when start and end dates are identical", () => {
    const singleDate = new Date("2026-08-19T00:00:00Z");

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn((text: string) => ({
        keywords: ["ネットワーク遅延", "ビルド失敗"],
        frequencies: { "ネットワーク遅延": 3, "ビルド失敗": 2 },
      })),
      assessImpactScore: jest.fn((keyword: string) => {
        const scoreMap: Record<string, number> = {
          "ネットワーク遅延": 65,
          "ビルド失敗": 78,
        };
        return scoreMap[keyword] || 50;
      }),
      classifyIssueSeverity: jest.fn((text: string) => "medium"),
    };

    const mockDailyReportRepository = {
      findByDateRange: jest.fn((startDate: Date, endDate: Date) => {
        if (
          startDate.getTime() === singleDate.getTime() &&
          endDate.getTime() === singleDate.getTime()
        ) {
          return [
            {
              reportId: "report-1",
              reportDate: singleDate,
              userId: "user-1",
              yesterdayWork: "DB接続テスト実施",
              todayPlan: "API仕様書作成",
              challenges: "ネットワーク遅延により接続テスト遅延",
            },
            {
              reportId: "report-2",
              reportDate: singleDate,
              userId: "user-2",
              yesterdayWork: "ビルド環境構築",
              todayPlan: "ユニットテスト作成",
              challenges: "ビルド失敗エラーの原因特定中",
            },
            {
              reportId: "report-3",
              reportDate: singleDate,
              userId: "user-3",
              yesterdayWork: "ドキュメント整理",
              todayPlan: "コードレビュー実施",
              challenges: "ネットワーク遅延の影響で同期が遅い",
            },
          ];
        }
        return [];
      }),
    };

    const request: WeeklyExtractionRequest = {
      weekStartDate: singleDate,
      weekEndDate: singleDate,
      teamIds: ["team-1"],
      requestedByUserId: "user-manager-1",
    };

    const result: WeeklyReportDataset = extractWeeklyReportData(
      request,
      mockTextAnalysisServiceAdapter,
      mockDailyReportRepository
    );

    expect(result.weekRange.startDate.getTime()).toBe(singleDate.getTime());
    expect(result.weekRange.endDate.getTime()).toBe(singleDate.getTime());
    expect(result.totalReportsExtracted).toBe(3);
    expect(result.reportsByDate).toHaveLength(1);
    expect(result.reportsByDate[0].reportDate.getTime()).toBe(
      singleDate.getTime()
    );
    expect(result.reportsByDate[0].reportCount).toBe(3);
    expect(result.reportsByDate[0].submittedByUserIds).toEqual([
      "user-1",
      "user-2",
      "user-3",
    ]);
    expect(result.reportsByDate[0].challengeItems).toEqual([
      "ネットワーク遅延により接続テスト遅延",
      "ビルド失敗エラーの原因特定中",
      "ネットワーク遅延の影響で同期が遅い",
    ]);
    expect(result.extractedChallenges).toHaveLength(2);
    expect(result.extractedChallenges[0].keyword).toBe("ネットワーク遅延");
    expect(result.extractedChallenges[0].occurrenceCount).toBe(2);
    expect(result.extractedChallenges[0].impactScore).toBe(65);
    expect(result.extractedChallenges[1].keyword).toBe("ビルド失敗");
    expect(result.extractedChallenges[1].occurrenceCount).toBe(1);
    expect(result.extractedChallenges[1].impactScore).toBe(78);
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(70);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
    expect(mockDailyReportRepository.findByDateRange).toHaveBeenCalledWith(
      singleDate,
      singleDate
    );
  });
});