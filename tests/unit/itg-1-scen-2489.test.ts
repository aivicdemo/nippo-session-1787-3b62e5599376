import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2489: [error] 操作習熟度スコア計算機能 - 操作ステップの時刻が報告送信時刻より後のとき、エラーを返す
  test('操作ステップのタイムスタンプが報告送信時刻を超過する場合、INVALID_OPERATION_TIMESTAMPエラーを返す', () => {
    const submissionTimestamp = new Date('2024-01-15T09:00:00Z');
    
    const input: SubmitDailyReportInput = {
      userId: 'engineer-001',
      teamId: 'team-A',
      yesterdayAccomplishment: 'Database optimization completed',
      todayPlan: 'API implementation for user module',
      challenges: 'Network latency affecting test execution',
      reportDate: '2024-01-15',
      operationSteps: [
        {
          stepId: 'step-1',
          actionName: 'form_opened',
          timestamp: new Date('2024-01-15T08:55:00Z')
        },
        {
          stepId: 'step-2',
          actionName: 'yesterday_accomplishment_entered',
          timestamp: new Date('2024-01-15T09:05:00Z')
        },
        {
          stepId: 'step-3',
          actionName: 'submit_button_clicked',
          timestamp: new Date('2024-01-15T09:10:00Z')
        }
      ],
      submissionTimestamp: submissionTimestamp
    };

    expect(() => submitDailyReport(input)).toThrow(/INVALID_OPERATION_TIMESTAMP/);
  });
});