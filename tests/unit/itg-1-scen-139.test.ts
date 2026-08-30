import { encryptReportData } from "../../src/logic/data-encryption-and-security";

describe("朝会報告管理システム - 日報暗号化", () => {
  test("SCEN-139: 必須フィールド欠落時にエラーを発生させる", () => {
    const reportDataWithMissingReporterId = {
      reporterId: null as any,
      teamId: "team-001",
      reportDate: "2026-08-19",
      personalInfo: "山田太郎",
      issueContent: "認証機能の脆弱性",
      progressInfo: "DB設計完了",
    };

    expect(() => {
      encryptReportData(reportDataWithMissingReporterId);
    }).toThrow(/日報データが不完全です。必須項目を確認してください。/);
  });
});