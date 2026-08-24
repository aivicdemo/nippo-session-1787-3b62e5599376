import { generateAndSendSummaryEmail, type GenerateAndSendSummaryEmailInput, type GenerateAndSendSummaryEmailOutput } from '../../src/logic/notification-delivery';

describe('generateAndSendSummaryEmail', () => {
  // SCEN-216: [error] 日報集約メール送信機能 - 部長のメールアドレスが空文字列のとき処理が進まない
  test('should throw error when manager email is empty string', async () => {
    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      managerUserId: 'manager-001',
      submittedReports: [
        {
          reporterId: 'engineer-001',
          reporterName: 'Engineer A',
          submittedAt: '2024-01-15T08:30:00Z',
          challenges: ['Database connection timeout', 'Memory leak in production']
        },
        {
          reporterId: 'engineer-002',
          reporterName: 'Engineer B',
          submittedAt: '2024-01-15T08:45:00Z',
          challenges: ['Build pipeline failure']
        }
      ],
      unsubmittedMemberIds: ['engineer-003', 'engineer-004'],
      reportDeadlineTime: '09:00'
    };

    expect(() => generateAndSendSummaryEmail(input, '')).toThrow(/メールアドレス/);
  });
});