import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { decryptReportDataForManager } from '../../src/logic/data-encryption-and-security';

describe('朝会報告管理システム - データ暗号化とセキュリティ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-143: [error] 部長が日報データを復号化して閲覧可能にする際に、ユーザーの権限を検証した上で暗号化された日報データを復号化し、復号化済みの日報内容を返す。 - 指定された報告IDに対応する日報データが存在しない場合。
  test('指定された報告IDに対応する日報データが存在しない場合、ReportNotFoundErrorが発生する', async () => {
    const reportId = 'report-999';
    const requestingUserId = 'manager-001';
    const requestingUserRole = '部長';
    const teamId = 'team-A';

    const judgeAccessPermissionStub = jest.fn().mockResolvedValue(true);

    await expect(
      decryptReportDataForManager(
        reportId,
        requestingUserId,
        requestingUserRole,
        teamId,
        judgeAccessPermissionStub
      )
    ).rejects.toThrow(/指定された日報が見つかりません。/);

    expect(judgeAccessPermissionStub).toHaveBeenCalledWith(
      requestingUserId,
      requestingUserRole,
      teamId
    );
  });
});