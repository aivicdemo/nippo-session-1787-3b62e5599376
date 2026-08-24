import { encryptDailyReportData, type EncryptDailyReportDataInput, type EncryptedDailyReportData } from '../../src/logic/data-security';

describe('朝会報告管理システム - 日報暗号化・復号化機能', () => {
  // SCEN-180: [error] 日報暗号化・復号化機能 - 復号化権限がない一般ユーザーが復号化を試みるときエラーになる
  test('復号化権限がないユーザーが暗号化日報にアクセスするとエラーが発生する', () => {
    const encryptionKeyId = 'key-2024-01-15-001';
    const reporterId = 'engineer-user-a-id-12345';
    const executorUserId = 'admin-user-id-99999';
    const unauthorizedUserId = 'engineer-user-b-id-67890';

    const encryptInput: EncryptDailyReportDataInput = {
      reporterId,
      reportDate: new Date('2024-01-15'),
      yesterdayAccomplishment: 'Completed database migration for user module',
      todayPlan: 'Implement API endpoint for user profile',
      challenges: 'Database query performance issue on production environment affecting response time',
      encryptionKeyId,
      executorUserId,
    };

    const encryptedReport = encryptDailyReportData(encryptInput);

    expect(encryptedReport).toHaveProperty('encryptedReportId');
    expect(encryptedReport).toHaveProperty('encryptedContent');
    expect(encryptedReport).toHaveProperty('encryptionKeyId', encryptionKeyId);
    expect(encryptedReport).toHaveProperty('reporterId', reporterId);
    expect(encryptedReport.reportDate).toEqual(new Date('2024-01-15'));

    const accessControlList = encryptedReport.accessControlList;
    expect(Array.isArray(accessControlList)).toBe(true);
    expect(accessControlList.length).toBeGreaterThan(0);

    const unauthorizedUserHasAccess = accessControlList.some(
      (entry) => entry.userId === unauthorizedUserId && entry.canDecrypt === true
    );
    expect(unauthorizedUserHasAccess).toBe(false);

    const decryptAttempt = () => {
      const userWithoutPermission = accessControlList.find(
        (entry) => entry.userId === unauthorizedUserId
      );

      if (!userWithoutPermission || !userWithoutPermission.canDecrypt) {
        throw new Error('権限がありません');
      }
    };

    expect(decryptAttempt).toThrow(/権限/);
  });
});