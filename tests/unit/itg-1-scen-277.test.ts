import { encryptReportData } from '../../src/logic/data-encryption-and-security';

describe('朝会報告管理システム - 日報データ暗号化', () => {
  test('SCEN-277: データベースへの保存に失敗した場合、適切なエラーをスローする', async () => {
    // 入力データの準備
    const reportData = {
      reporterId: 'ENG001',
      teamId: 'TEAM-A',
      reportDate: '2026-08-19',
      personalInfo: '田中太郎',
      issueContent: 'データベース接続タイムアウト',
      progressInfo: 'API実装50%完了'
    };

    // encryptReportData 関数を直接呼び出し、エラーをキャッチ
    await expect(encryptReportData(reportData)).rejects.toThrow(/保存に失敗/);
  });
});