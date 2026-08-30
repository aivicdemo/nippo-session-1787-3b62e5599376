import { encryptReportData } from '../../src/logic/data-encryption-and-security';

describe('朝会報告管理システム - データ暗号化・セキュリティ', () => {
  // SCEN-275: [error] 日報の個人情報・課題内容・進捗情報を暗号化して安全に保存用に準備する - 日報データが空または null のときという明示された境界条件で日報内容が空です。3項目すべてを入力してください
  test('encryptReportData: 日報データが null のとき InvalidReportDataError をスロー', () => {
    const nullReportData = {
      reporterId: null,
      teamId: null,
      reportDate: null,
      personalInfo: null,
      issueContent: null,
      progressInfo: null,
    };

    expect(() => encryptReportData(nullReportData as any)).toThrow(
      /日報内容が空です。3項目すべてを入力してください/
    );
  });
});