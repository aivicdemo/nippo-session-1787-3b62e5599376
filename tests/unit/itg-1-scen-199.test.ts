import { encryptDailyReportData, type EncryptDailyReportDataInput, type EncryptedDailyReportData } from '../../src/logic/data-security';

describe('朝会報告管理システム - データセキュリティ', () => {
  // SCEN-199: [edge] 日報暗号化・復号化機能 - 部長権限のない一般ユーザーは暗号化された日報を復号化できず、アクセス拒否される
  test('一般ユーザーは暗号化された日報の復号化を要求されたとき、権限不足によりアクセス拒否される', () => {
    const encryptionInput: EncryptDailyReportDataInput = {
      reporterId: 'ENG-001',
      reportDate: new Date('2024-01-15'),
      yesterdayAccomplishment: 'フロントエンド画面の改修を完了した',
      todayPlan: 'APIテスト仕様書作成を実施する',
      challenges: 'クライアント側のバリデーション実装に時間がかかった',
      encryptionKeyId: 'KEY-2024-01-15',
      executorUserId: 'EXEC-001'
    };

    const encryptedReport: EncryptedDailyReportData = encryptDailyReportData(encryptionInput);

    expect(encryptedReport).toBeDefined();
    expect(encryptedReport.encryptedReportId).toMatch(/^ENC-/);
    expect(encryptedReport.reporterId).toBe('ENG-001');
    expect(encryptedReport.reportDate).toEqual(new Date('2024-01-15'));
    expect(encryptedReport.encryptionKeyId).toBe('KEY-2024-01-15');
    expect(encryptedReport.encryptedContent).toBeDefined();
    expect(encryptedReport.encryptedContent.length).toBeGreaterThan(0);
    expect(encryptedReport.encryptedAt).toBeDefined();

    expect(encryptedReport.accessControlList).toBeDefined();
    expect(Array.isArray(encryptedReport.accessControlList)).toBe(true);
    expect(encryptedReport.accessControlList.length).toBeGreaterThan(0);

    const generalUserAccessEntry = encryptedReport.accessControlList.find(
      (entry) => entry.userRole === 'engineer'
    );
    expect(generalUserAccessEntry).toBeDefined();
    if (generalUserAccessEntry) {
      expect(generalUserAccessEntry.canDecrypt).toBe(false);
    }

    const directorAccessEntry = encryptedReport.accessControlList.find(
      (entry) => entry.userRole === 'director'
    );
    expect(directorAccessEntry).toBeDefined();
    if (directorAccessEntry) {
      expect(directorAccessEntry.canDecrypt).toBe(true);
    }
  });
});