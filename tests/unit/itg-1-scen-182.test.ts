import { submitReport } from '../../src/logic/report-submission-management';
import { type SubmitReportInput } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム - 日報送信管理', () => {
  // SCEN-182
  test('昨日の実績が空またはスペースのみのとき、エラーを throw する', () => {
    const input: SubmitReportInput = {
      reporterId: 'ENG001',
      teamId: 'TEAM-A',
      reportDate: new Date('2024-01-15T00:00:00Z'),
      yesterdayAccomplishment: '',
      todayPlan: '今日やること',
      issuesAndConcerns: '抱えている課題',
    };

    expect(() => submitReport(input)).toThrow(/昨日やったことを入力してください/);
  });
});