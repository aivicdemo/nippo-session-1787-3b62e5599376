import { saveReport, type SaveReportInput, type SaveReportOutput } from '../../src/logic/report-persistence';

describe('朝会報告管理システム - 日報永続化', () => {
  // SCEN-146: [normal] 日報データを受け取り、暗号化して永続化層に保存し、送信時刻を記録する
  test('saveReportが代表的な正常入力を設計どおり処理する', async () => {
    const input: SaveReportInput = {
      reporterId: 'user001',
      teamId: 'team-A',
      reportDate: new Date('2026-08-19T00:00:00Z'),
      yesterdayAccomplishment: 'バグ修正を2件完了',
      todayPlan: '新機能のレビュー実施',
      issuesAndConcerns: 'データベース接続の遅延が発生',
      attachmentUrls: []
    };

    const result: SaveReportOutput = await saveReport(input);

    expect(result.reportId).toBe('rpt-20260819-001');
    expect(result.encryptionStatus).toBe('encrypted');
    
    const now = new Date();
    const resultTimestamp = new Date(result.submissionTimestamp);
    const timeDiffMs = Math.abs(resultTimestamp.getTime() - now.getTime());
    expect(timeDiffMs).toBeLessThanOrEqual(5000);
  });
});