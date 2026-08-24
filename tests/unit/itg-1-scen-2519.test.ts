import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('Daily Report Management - Submit Daily Report', () => {
  // SCEN-2519: [error] 初回テスト報告の入力検証 - 報告者IDが空文字列のとき入力検証エラーが返される
  test('should return validation error when userId is empty string', async () => {
    const input = {
      userId: '',
      teamId: 'team-001',
      yesterdayAccomplishment: 'ドキュメント作成',
      todayPlan: 'レビュー実施',
      challenges: 'リソース不足',
      reportDate: '2024-01-15'
    };

    const result = await submitDailyReport(input);

    expect(result).toEqual({
      success: false,
      statusCode: 400,
      error: {
        fieldName: 'userId',
        errorCode: 'MissingRequiredField',
        message: '報告者IDは必須項目です。空文字列は指定できません'
      }
    });
  });
});