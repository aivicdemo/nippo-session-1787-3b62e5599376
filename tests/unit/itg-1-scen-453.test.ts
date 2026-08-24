import { generateAndSendConfirmationEmail } from '../../src/logic/notification-delivery';
import { type ConfirmationEmailInput, type ConfirmationEmailOutput } from '../../src/logic/notification-delivery';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-453
  test('報告データの日報テキストが空のとき処理を中止しエラーを返す', async () => {
    const emptyReportInput: ConfirmationEmailInput = {
      reportDeadlineDateTime: new Date('2024-01-15T09:00:00Z'),
      aggregatedReports: [
        {
          reportId: 'report-001',
          reporterUserId: 'user-001',
          reporterName: 'Engineer A',
          yesterdayAccomplishment: '',
          todayPlan: '',
          challenges: '',
          submissionDateTime: new Date('2024-01-15T08:30:00Z'),
        },
      ],
      managerUserId: 'manager-001',
      teamId: 'team-001',
      analysisDate: new Date('2024-01-15'),
    };

    const result = await generateAndSendConfirmationEmail(emptyReportInput);

    expect(result).toEqual(
      expect.objectContaining({
        code: 'EMPTY_REPORT_TEXT',
        message: expect.stringMatching(/日報テキスト/),
      })
    );
  });
});