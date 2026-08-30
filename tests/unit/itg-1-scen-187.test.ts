import { submitReport } from '../../src/logic/report-submission-management';
import { type SubmitReportInput } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム - 日報送信処理', () => {
  // SCEN-187
  test('抱えている課題が空文字列のとき、ValidationErrorを発生させる', () => {
    const input: SubmitReportInput = {
      reporterId: 'engineer-001',
      teamId: 'team-a',
      reportDate: new Date('2024-01-15'),
      yesterdayAccomplishment: 'yesterday task completed successfully',
      todayPlan: 'today task planned for execution',
      issuesAndConcerns: '',
    };

    expect(() => submitReport(input)).toThrow(/抱えている課題/);
  });
});