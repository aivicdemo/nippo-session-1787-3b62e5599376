import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('Daily Report Management - submitDailyReport', () => {
  // SCEN-2195: [normal] 日報入力検証機能 - 昨日やったことと今日やることが入力されていて抱えている課題が空文字列の場合、抱えている課題項目のみにエラーメッセージが表示される
  test('should return validation error for challenges field only when yesterdayAccomplishment and todayPlan are valid but challenges is empty', () => {
    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'ドキュメント作成完了',
      todayPlan: 'レビュー対応',
      challenges: '',
      reportDate: '2024-01-15'
    };

    const result = submitDailyReport(input);

    expect(result).toEqual({
      isValid: false,
      errors: [
        {
          fieldName: 'challenges',
          errorCode: 'MissingRequiredField',
          message: '抱えている課題は必須項目です'
        }
      ]
    });
  });
});