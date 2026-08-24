import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信処理', () => {
  // SCEN-2511: [error] 初回テスト報告の入力検証 - 報告者IDが欠落しているとき入力検証エラーが返される
  test('報告者IDが欠落している場合、HTTPステータスコード400とVALIDATION_ERRORエラーが返される', () => {
    const invalidInput = {
      userId: '',
      teamId: 'team-001',
      yesterdayAccomplishment: '前日実績が記載されている',
      todayPlan: '本日予定が記載されている',
      challenges: '課題が記載されている',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(invalidInput);

    expect(result).toEqual({
      statusCode: 400,
      errorCode: 'VALIDATION_ERROR',
      errorMessage: '報告者IDは必須項目です',
      errorField: 'userId',
      reportId: null,
      submissionTimestamp: null,
      isWithinDeadline: null,
    });
  });
});