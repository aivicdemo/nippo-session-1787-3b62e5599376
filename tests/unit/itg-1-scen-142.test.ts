import { decryptReportDataForManager } from '../../src/logic/data-encryption-and-security';

describe('朝会報告管理システム', () => {
  test('SCEN-142: 暗号化されたデータが破損している場合、復号化に失敗してエラーメッセージを返す', () => {
    // Given: 復号化対象の入力パラメータ
    const reportId = 'RPT-001';
    const requestingUserId = 'MGR-123';
    const requestingUserRole = '部長';
    const teamId = 'TEAM-A';

    // When: decryptReportDataForManager を実行
    // Then: 復号化失敗エラーが発生することを検証
    expect(() => {
      decryptReportDataForManager({
        reportId,
        requestingUserId,
        requestingUserRole,
        teamId
      });
    }).toThrow(/復号化に失敗しました/);
  });
});