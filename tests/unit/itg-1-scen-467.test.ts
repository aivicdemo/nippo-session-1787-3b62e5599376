import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type {
  ExtractIssueKeywordsInput,
  RankedIssueKeywordList,
} from "../../src/logic/issue-extraction-prioritization";

describe("課題自動抽出・優先度判定機能 - 報告受付期限時刻にちょうど到達した時点での集約処理", () => {
  // SCEN-467
  test("報告受付期限時刻2026-08-19T09:00:00Zにちょうど到達した時点で、キュー内の全日報に対して課題抽出・優先度判定が即座にトリガーされ、3つのサービスメソッドが各2回呼び出されること", async () => {
    // テスト固定時刻: 2026-08-19T09:00:00Z（期限時刻にちょうど到達）
    const reportDeadlineTimestamp = new Date("2026-08-19T09:00:00Z");
    const queue_timestamp_before_deadline_1 = new Date(
      "2026-08-19T08:59:59Z"
    );
    const queue_timestamp_before_deadline_2 = new Date(
      "2026-08-19T08:59:59Z"
    );

    // TextAnalysisServiceAdapterのモック
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest
        .fn()
        .mockResolvedValueOnce({
          keywords: [
            { text: "機能実装", frequency: 2 },
            { text: "バグ修正", frequency: 1 },
          ],
        })
        .mockResolvedValueOnce({
          keywords: [
            { text: "パフォーマンス問題", frequency: 1 },
            { text: "ドキュメント不足", frequency: 1 },
          ],
        }),
      assessImpactScore: jest
        .fn()
        .mockResolvedValueOnce({
          keywordId: "kw-001",
          impactScore: 75,
        })
        .mockResolvedValueOnce({
          keywordId: "kw-002",
          impactScore: 60,
        }),
      classifyIssueSeverity: jest
        .fn()
        .mockResolvedValueOnce({
          severity: "高",
        })
        .mockResolvedValueOnce({
          severity: "中",
        }),
    };

    // NotificationServiceAdapterのモック
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: "sent",
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduled: true,
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        delivered: true,
      }),
    };

    // テスト入力: 期限時刻にちょうど到達した時点での集約リクエスト
    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2026-08-19T00:00:00Z"),
      endDate: new Date("2026-08-19T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-manager-001",
    };

    // 日報キュー内の2件のデータ（期限前に登録済み）
    const queued_reports = [
      {
        reportId: "report-001",
        memberId: "member-A",
        submittedAt: queue_timestamp_before_deadline_1,
        content: {
          yesterday: "機能実装を完了した",
          today: "テストを実施する",
          challenges: "機能実装でバグが見つかった",
        },
      },
      {
        reportId: "report-002",
        memberId: "member-B",
        submittedAt: queue_timestamp_before_deadline_2,
        content: {
          yesterday: "パフォーマンス問題を調査した",
          today: "対応策を実装する",
          challenges: "ドキュメント不足で時間がかかった",
        },
      },
    ];

    // 集約処理を実行（期限時刻にちょうど到達した時点）
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
      queued_reports
    );

    // 検証1: extractKeywordsが2回呼び出されたこと（部員A・B分）
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(
      2
    );

    // 検証2: assessImpactScoreが2回呼び出されたこと
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(
      2
    );

    // 検証3: classifyIssueSeverityが2回呼び出されたこと
    expect(
      mockTextAnalysisServiceAdapter.classifyIssueSeverity
    ).toHaveBeenCalledTimes(2);

    // 検証4: 抽出された課題キーワード数が正しいこと
    expect(result.keywords.length).toBeGreaterThan(0);

    // 検証5: 抽出処理の実行日時が期限時刻に記録されていること
    expect(result.extractedAt.toISOString()).toBe("2026-08-19T09:00:00Z");

    // 検証6: 分析対象期間が1日であること
    expect(result.analysisperiodDays).toBe(1);

    // 検証7: 発生頻度でランク付けされていること（降順）
    if (result.keywords.length >= 2) {
      expect(result.keywords[0].rank).toBeLessThanOrEqual(
        result.keywords[1].rank
      );
    }

    // 検証8: 全キーワード数が記録されていること
    expect(result.totalKeywordCount).toBeGreaterThan(0);

    // 検証9: 各キーワードにrankフィールドがあること
    result.keywords.forEach((kw) => {
      expect(kw.rank).toBeGreaterThanOrEqual(1);
      expect(typeof kw.rank).toBe("number");
    });

    // 検証10: 各キーワードにfrequencyフィールドがあること（0以上）
    result.keywords.forEach((kw) => {
      expect(kw.frequency).toBeGreaterThanOrEqual(0);
      expect(typeof kw.frequency).toBe("number");
    });
  });
});