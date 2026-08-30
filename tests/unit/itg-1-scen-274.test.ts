import { encryptReportData } from "../../src/logic/data-encryption-and-security";

describe("朝会報告管理システム", () => {
  test("SCEN-274: 日報の個人情報・課題内容・進捗情報を暗号化して安全に保存用に準備する", () => {
    // 入力値を準備
    const reporterId = "ENG001";
    const teamId = "TEAM-A";
    const reportDate = "2026-08-20T09:00:00Z";
    const personalInfo = "山田太郎、営業部門";
    const issueContent = "データベース接続タイムアウト問題";
    const progressInfo = "API開発完了率75%";

    // encryptReportDataを実行
    const result = encryptReportData(
      reporterId,
      teamId,
      reportDate,
      personalInfo,
      issueContent,
      progressInfo
    );

    // 戻り値のEncryptedReportDataオブジェクトを検証
    // (1) reportIdが空文字ではない一意の識別子である
    expect(result.reportId).toBeTruthy();
    expect(typeof result.reportId).toBe("string");
    expect(result.reportId.length).toBeGreaterThan(0);

    // (2) encryptedPersonalInfoが暗号化されている
    expect(result.encryptedPersonalInfo).toBeTruthy();
    expect(typeof result.encryptedPersonalInfo).toBe("string");
    expect(result.encryptedPersonalInfo.length).toBeGreaterThan(0);

    // (3) encryptedIssueContentが暗号化されている
    expect(result.encryptedIssueContent).toBeTruthy();
    expect(typeof result.encryptedIssueContent).toBe("string");
    expect(result.encryptedIssueContent.length).toBeGreaterThan(0);

    // (4) encryptedProgressInfoが暗号化されている
    expect(result.encryptedProgressInfo).toBeTruthy();
    expect(typeof result.encryptedProgressInfo).toBe("string");
    expect(result.encryptedProgressInfo.length).toBeGreaterThan(0);

    // 暗号化されたデータは元のプレーンテキストと異なることを確認
    expect(result.encryptedPersonalInfo).not.toBe(personalInfo);
    expect(result.encryptedIssueContent).not.toBe(issueContent);
    expect(result.encryptedProgressInfo).not.toBe(progressInfo);
  });
});