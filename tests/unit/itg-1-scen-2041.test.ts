import { submitDailyReport } from "../../src/logic/daily-report-management";
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from "../../src/logic/daily-report-management";

describe("submitDailyReport", () => {
  // SCEN-2041: [error] 対策案・実行計画の必須項目検証 - 指定された承認権者が開発部長権限を持たないユーザーのとき検証エラーになる
  test("should throw validation error when designated approver lacks 開発部長 role", () => {
    const input: SubmitDailyReportInput = {
      userId: "user-admin-001",
      teamId: "team-development-001",
      yesterdayAccomplishment: "前日は新機能の基本設計とテスト環境構築を完了しました。",
      todayPlan: "本日は設計レビューを実施し、実装フェーズに移行します。",
      challenges: "テスト環境のセットアップで予想外の構成問題が発生しています。",
      reportDate: "2024-01-15",
    };

    expect(() => submitDailyReport(input)).toThrow(/開発部長権限/);
  });
});