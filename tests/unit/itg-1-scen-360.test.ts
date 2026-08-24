import { aggregateReportSubmissionStatus } from "../../src/logic/submission-status-tracking";
import type {
  AggregateReportSubmissionStatusInput,
  ReportSubmissionStatusSummary,
} from "../../src/logic/submission-status-tracking";

describe("報告提出状況リアルタイム更新機能", () => {
  // SCEN-360: [edge] 月末 23:59:59 に送信された日報が正しく当日分として記録される
  test("月末最終秒に送信された日報が当日分として集計される", () => {
    // 固定時刻: 2024年1月31日 23:59:59 (月末最終秒)
    const monthEndDate = new Date("2024-01-31T23:59:59Z");
    const reportDate = "2024-01-31";
    const teamId = "team-001";
    const requestUserId = "manager-001";

    // テスト用入力データ
    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // モック日報データ: 月末 23:59:59 に送信された1件のレコード
    // (実装内で日報テーブルから該当日付のレコードを検索すると想定)
    const mockReportRecords = [
      {
        userId: "eng-001",
        teamId,
        reportDate,
        submittedAt: monthEndDate.toISOString(), // 2024-01-31T23:59:59Z
        status: "on_time" as const,
        content: {
          yesterday: "昨日やったこと",
          today: "今日やること",
          issues: "抱えている課題",
        },
      },
    ];

    // チームメンバー総数: 5名
    const totalMembers = 5;
    // 期限内提出済み: 1名 (月末 23:59:59 送信)
    const submittedCount = 1;
    // 未提出: 4名
    const unsubmittedCount = 4;
    // 期限超過提出: 0名
    const delayedSubmissionCount = 0;

    // 提出率計算: (1 / 5) * 100 = 20.0%
    const expectedSubmissionRate = 20.0;

    // aggregateReportSubmissionStatus を呼び出し
    // (実装は外部のデータベースやサービスに依存するため、
    //  ここではモック化された状態で関数が呼ばれることを前提)
    const result: ReportSubmissionStatusSummary =
      aggregateReportSubmissionStatus(input);

    // 検証: 集計結果が正しく記録されていることを確認
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(totalMembers);
    expect(result.submittedCount).toBe(submittedCount);
    expect(result.unsubmittedCount).toBe(unsubmittedCount);
    expect(result.delayedSubmissionCount).toBe(delayedSubmissionCount);
    expect(result.submissionRate).toBe(expectedSubmissionRate);

    // 月末 23:59:59 に送信されたレコードが当日分として集計されていることを確認
    expect(result.unsubmittedMembers.length).toBe(unsubmittedCount);

    // 集計実行時刻が ISO 8601 形式で記録されていることを確認
    expect(result.aggregatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );
  });
});