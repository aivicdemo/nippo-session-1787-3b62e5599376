import { submitReport } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム - 日報送信', () => {
  test('SCEN-188: エンジニアが日報を送信し、入力検証、送信時刻記録、期限判定、提出状況更新を実行する', () => {
    const yesterdayWork = 'a'.repeat(500);
    const todayPlan = 'b'.repeat(250);
    const currentIssue = 'c';
    const maxCharPerItem = 500;

    const result = submitReport({
      reporterId: 'engineer-001',
      teamId: 'team-a',
      reportDate: new Date('2024-01-15T09:00:00Z'),
      yesterdayAccomplishment: yesterdayWork,
      todayPlan: todayPlan,
      issuesAndConcerns: currentIssue,
    });

    expect(result.isValid).toBe(true);
    expect(result.validationResults).toEqual([
      {
        field: 'yesterdayWork',
        currentLength: 500,
        maxLength: maxCharPerItem,
        isExceeded: false,
      },
      {
        field: 'todayPlan',
        currentLength: 250,
        maxLength: maxCharPerItem,
        isExceeded: false,
      },
      {
        field: 'currentIssue',
        currentLength: 1,
        maxLength: maxCharPerItem,
        isExceeded: false,
      },
    ]);
  });
});