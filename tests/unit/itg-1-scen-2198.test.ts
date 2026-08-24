import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-2198
  test('日報入力検証機能 - 昨日やったことのみが入力されていて他の2項目が空文字列の場合、今日やることと抱えている課題の2項目にエラーメッセージが表示される', async () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '昨日はドキュメント作成を完了した',
      todayPlan: '',
      challenges: '',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: 'todayPlan',
          errorCode: 'MissingRequiredField',
          message: '今日やることは必須項目です',
        }),
        expect.objectContaining({
          fieldName: 'challenges',
          errorCode: 'MissingRequiredField',
          message: '抱えている課題は必須項目です',
        }),
      ])
    );
  });
});