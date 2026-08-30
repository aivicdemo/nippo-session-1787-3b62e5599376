import { decryptReportDataForManager } from "../../src/logic/data-encryption-and-security";

describe("朝会報告管理システム - データ暗号化とセキュリティ", () => {
  test("SCEN-141: 部長権限がないユーザーが日報データを復号化しようとした場合、UnauthorizedDecryptionErrorが発生する", () => {
    const reportId = "RPT-001";
    const requestingUserId = "USR-002";
    const requestingUserRole = "staff";
    const teamId = "TEAM-A";

    expect(() => {
      decryptReportDataForManager({
        reportId,
        requestingUserId,
        requestingUserRole,
        teamId,
      });
    }).toThrow(/復号化権限/);
  });
});