import { saveReport } from '../../src/logic/report-persistence';
import type { SaveReportInput, SaveReportOutput } from '../../src/logic/report-persistence';

describe('朝会報告管理システム - 日報永続化', () => {
  // SCEN-606: [normal] 日報データを受け取り、暗号化して永続化層に保存し、送信時刻を記録する
  test('should encrypt and persist daily report with submission timestamp', async () => {
    const input: SaveReportInput = {
      reporterId: 'ENG001',
      teamId: 'TEAM-A',
      reportDate: new Date('2026-01-15T00:00:00Z'),
      yesterdayAccomplishment: '昨日は機能Aの実装を完了',
      todayPlan: '本日は機能Bのレビューを予定',
      issuesAndConcerns: 'データベース接続のタイムアウト問題を抱えている',
      attachmentUrls: [],
    };

    const expectedOutput: SaveReportOutput = {
      reportId: 'RPT-20260115-001',
      submissionTimestamp: new Date('2026-01-15T09:30:45.000Z'),
      encryptionStatus: 'encrypted',
    };

    const result = await saveReport(input);

    expect(result.reportId).toBe(expectedOutput.reportId);
    expect(result.encryptionStatus).toBe(expectedOutput.encryptionStatus);
    expect(result.submissionTimestamp).toEqual(
      expect.any(Date),
    );
    expect(result.submissionTimestamp.getTime()).toBeGreaterThanOrEqual(
      expectedOutput.submissionTimestamp.getTime(),
    );
  });
});