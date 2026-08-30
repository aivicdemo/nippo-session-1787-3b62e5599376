import { encryptReportData } from "../../src/logic/data-encryption-and-security";

describe("朝会報告管理システム - データ暗号化・セキュリティ", () => {
  test("SCEN-138: encryptReportDataが代表的な正常入力を設計どおり処理する", async () => {
    // スタブ関数の定義
    const encryptSensitiveFieldStub = jest.fn()
      .mockResolvedValueOnce({
        encryptedText: "encrypted_personal_xxx",
        encryptionTimestamp: new Date("2026-08-19T10:00:00Z"),
      })
      .mockResolvedValueOnce({
        encryptedText: "encrypted_issue_yyy",
        encryptionTimestamp: new Date("2026-08-19T10:00:00Z"),
      })
      .mockResolvedValueOnce({
        encryptedText: "encrypted_progress_zzz",
        encryptionTimestamp: new Date("2026-08-19T10:00:00Z"),
      });

    const judgeAccessPermissionStub = jest.fn().mockResolvedValue(true);

    // 入力値の構成
    const reporterIdInput = "user-001";
    const teamIdInput = "team-A";
    const reportDateInput = "2026-08-19";
    const personalInfoInput = "田中太郎（営業部）";
    const issueContentInput = "顧客A向けシステム連携遅延";
    const progressInfoInput = "API仕様書レビュー完了、実装開始";

    const reportDataToEncrypt = {
      reporterId: reporterIdInput,
      teamId: teamIdInput,
      reportDate: reportDateInput,
      personalInfo: personalInfoInput,
      issueContent: issueContentInput,
      progressInfo: progressInfoInput,
    };

    // encryptReportDataを呼び出し
    const result = await encryptReportData(
      reportDataToEncrypt,
      encryptSensitiveFieldStub,
      judgeAccessPermissionStub
    );

    // 期待値の検証
    expect(result).toBeDefined();
    expect(result.reportId).toMatch(/^[a-zA-Z0-9\-_]+$/);
    expect(result.encryptedPersonalInfo).toBe("encrypted_personal_xxx");
    expect(result.encryptedIssueContent).toBe("encrypted_issue_yyy");
    expect(result.encryptedProgressInfo).toBe("encrypted_progress_zzz");

    // スタブの呼び出し回数を検証
    expect(encryptSensitiveFieldStub).toHaveBeenCalledTimes(3);
    expect(judgeAccessPermissionStub).toHaveBeenCalled();
  });
});