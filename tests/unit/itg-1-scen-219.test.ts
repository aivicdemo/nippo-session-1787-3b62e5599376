import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';

describe('部長向けダッシュボード - 本日の報告提出状況リアルタイム表示', () => {
  // SCEN-219: [error] 日報集約メール送信機能 - チームIDが null のとき処理が進まない
  test('チームIDが null の場合、ValidationError がスローされ、通知は送信されない', () => {
    const input = {
      teamId: null as any,
      reportDate: '2024-01-15',
      managerUserId: 'manager-001',
      submittedReports: [
        {
          reporterId: 'engineer-001',
          reporterName: 'Taro Yamada',
          submittedAt: '2024-01-15T08:15:00Z',
          challenges: ['Database performance issue'],
        },
      ],
      unsubmittedMemberIds: [],
      reportDeadlineTime: '09:00',
    };

    expect(() => generateAndSendSummaryEmail(input)).toThrow(/チームID/);
  });
});