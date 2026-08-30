import { getReportSubmissionTimestamp } from '../../src/logic/report-persistence';
import type { GetReportSubmissionTimestampInput, ReportSubmissionTimestampOutput } from '../../src/logic/report-persistence';

describe('朝会報告管理システム - 報告送信時刻取得', () => {
  test('SCEN-159: 指定された日報の送信時刻を取得し、報告期限管理と遅延判定の基礎データを提供する', async () => {
    const input: GetReportSubmissionTimestampInput = {
      reportId: 'RPT-20250819-001',
      requestingUserId: 'USER-001'
    };

    const expectedOutput: ReportSubmissionTimestampOutput = {
      reportId: 'RPT-20250819-001',
      submissionTimestamp: new Date('2025-08-19T09:30:45.000Z'),
      submittedByUserId: 'USER-002',
      reportDate: new Date('2025-08-19')
    };

    const result = await getReportSubmissionTimestamp(input);

    expect(result.reportId).toBe(expectedOutput.reportId);
    expect(result.submissionTimestamp).toEqual(expectedOutput.submissionTimestamp);
    expect(result.submittedByUserId).toBe(expectedOutput.submittedByUserId);
    expect(result.reportDate).toEqual(expectedOutput.reportDate);
  });
});