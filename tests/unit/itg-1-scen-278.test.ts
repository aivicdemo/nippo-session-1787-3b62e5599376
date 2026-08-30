import { encryptReportData } from "../../src/logic/data-encryption-and-security";
import type { ReportDataToEncrypt, EncryptedReportData } from "../../src/logic/data-encryption-and-security";

jest.mock("../../src/logic/data-encryption-and-security", () => {
  const actual = jest.requireActual("../../src/logic/data-encryption-and-security");
  return {
    ...actual,
    encryptSensitiveField: jest.fn(),
    calculateIntegrityHash: jest.fn(),
  };
});

const { encryptSensitiveField, calculateIntegrityHash } = require("../../src/logic/data-encryption-and-security");

describe("朝会報告管理システム - 日報暗号化", () => {
  test("SCEN-278: 整合性チェック値の計算に失敗したときに警告を出力して日報は暗号化済みで返される", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

    const reportInput: ReportDataToEncrypt = {
      reporterId: "ENG001",
      teamId: "TEAM-A",
      reportDate: "2026-08-19",
      personalInfo: "山田太郎、営業部門",
      issueContent: "API応答遅延の調査",
      progressInfo: "テスト環境構築完了",
    };

    const encryptedPersonalInfoValue = "encrypted_personal_xyz123";
    const encryptedIssueContentValue = "encrypted_issue_abc456";
    const encryptedProgressInfoValue = "encrypted_progress_def789";

    encryptSensitiveField.mockImplementation((input: any) => {
      if (input.fieldType === "personal_info") {
        return { encryptedText: encryptedPersonalInfoValue, encryptionTimestamp: new Date("2026-08-19T10:00:00Z") };
      } else if (input.fieldType === "issue_content") {
        return { encryptedText: encryptedIssueContentValue, encryptionTimestamp: new Date("2026-08-19T10:00:01Z") };
      } else if (input.fieldType === "progress_info") {
        return { encryptedText: encryptedProgressInfoValue, encryptionTimestamp: new Date("2026-08-19T10:00:02Z") };
      }
      return { encryptedText: "", encryptionTimestamp: new Date() };
    });

    const integrityHashError = new Error("SHA-256ハッシュ計算の内部エラー");
    calculateIntegrityHash.mockImplementation(() => {
      throw integrityHashError;
    });

    const result: EncryptedReportData = await encryptReportData(reportInput, "encryption_key_secret");

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(result.reportId).not.toBe("");
    expect(result.encryptedPersonalInfo).toBe(encryptedPersonalInfoValue);
    expect(result.encryptedIssueContent).toBe(encryptedIssueContentValue);
    expect(result.encryptedProgressInfo).toBe(encryptedProgressInfoValue);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/日報は保存されましたが、改ざん検知機能に一時的な問題があります/));

    expect(result.integrityHash).toBeFalsy();

    expect(encryptSensitiveField).toHaveBeenCalledTimes(3);
    expect(encryptSensitiveField).toHaveBeenNthCalledWith(1, expect.objectContaining({ fieldType: "personal_info" }));
    expect(encryptSensitiveField).toHaveBeenNthCalledWith(2, expect.objectContaining({ fieldType: "issue_content" }));
    expect(encryptSensitiveField).toHaveBeenNthCalledWith(3, expect.objectContaining({ fieldType: "progress_info" }));

    consoleSpy.mockRestore();
  });
});