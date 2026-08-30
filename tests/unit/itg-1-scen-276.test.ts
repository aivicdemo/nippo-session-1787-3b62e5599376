import { encryptReportData } from '../../src/logic/data-encryption-and-security';

describe('朝会報告管理システム - データ暗号化セキュリティ', () => {
  // SCEN-276
  test('encryptReportData: 暗号化キーが無効または期限切れのとき、EncryptionFailureErrorをスロー', () => {
    const reporterId = 'ENG001';
    const teamId = 'TEAM-A';
    const reportDate = '2025-01-15';
    const personalInfo = '山田太郎';
    const issueContent = 'データベース接続タイムアウト';
    const progressInfo = 'API開発50%完了';

    expect(() => {
      encryptReportData({
        reporterId,
        teamId,
        reportDate,
        personalInfo,
        issueContent,
        progressInfo,
      });
    }).toThrow(/暗号化キーが無効/);
  });
});