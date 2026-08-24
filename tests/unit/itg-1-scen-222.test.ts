import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';

describe('朝会報告メール送信機能', () => {
  test('SCEN-222: 送信タイムスタンプが不正な日時形式のとき処理が進まない', () => {
    // 不正なタイムスタンプを含むテストデータ
    const invalidTimestampInput = {
      teamId: 'team-001',
      reportDate: '2026-08-19',
      managerUserId: 'manager-001',
      submittedReports: [
        {
          reporterId: 'engineer-001',
          reporterName: 'Engineer A',
          submittedAt: '2026-13-45T99:99:99Z', // 不正な日時形式
          challenges: ['課題1'],
        },
      ],
      unsubmittedMemberIds: [],
      reportDeadlineTime: '09:00',
    };

    // 不正なタイムスタンプでエラーが発生することを確認
    expect(() => generateAndSendSummaryEmail(invalidTimestampInput)).toThrow(
      /タイムスタンプ/,
    );
  });
});