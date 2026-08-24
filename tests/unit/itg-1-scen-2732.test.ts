import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('Report Modification Window Validation', () => {
  // SCEN-2732: [error] 報告修正期限管理機能 - 部長メールアドレスが無効なフォーマットのとき修正禁止エラーが発生する
  test('should reject modification when manager email format is invalid', () => {
    const invalidEmails = [
      'invalid-email',
      'user@',
      '@example.com',
      'user @example.com',
      'user@example',
      'user.example.com',
      '',
    ];

    const submittedAt = new Date('2024-01-15T08:00:00Z');
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');

    invalidEmails.forEach((invalidEmail) => {
      expect(() =>
        validateReportModificationWindow({
          submittedAt,
          morningMeetingStartTime,
          managerEmail: invalidEmail,
        })
      ).toThrow(/メールアドレス/);
    });
  });
});