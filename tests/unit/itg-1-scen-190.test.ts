import { submitReport } from '../../src/logic/report-submission-management';
import { type SubmitReportInput } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-190
  test('本日の予定が501文字（上限超過）のとき、ValidationError をスローする', () => {
    const todayPlanExceeded = 'a'.repeat(501);
    const input: SubmitReportInput = {
      reporterId: 'ENG001',
      teamId: 'TEAM-A',
      reportDate: new Date('2024-01-15'),
      yesterdayAccomplishment: '昨日完了したタスク',
      todayPlan: todayPlanExceeded,
      issuesAndConcerns: '現在の課題',
    };

    expect(() => submitReport(input)).toThrow(/本日の予定は500文字以内で入力してください/);
  });
});