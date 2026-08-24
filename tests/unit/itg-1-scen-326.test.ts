import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('submitDailyReport バリデーション機能', () => {
  test('SCEN-326: 昨日やったことが空文字列のとき該当項目がエラー表示される', () => {
    // 入力: 「昨日やったこと」が空文字列、他の項目は有効
    const invalidInput: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '',
      todayPlan: '会議準備',
      challenges: 'ドキュメント作成',
      reportDate: '2024-01-15',
    };

    // 期待結果: ValidationResult を返し、isValid が false で「昨日やったこと」に関するエラーを含む
    expect(() => submitDailyReport(invalidInput)).toThrow(/昨日やったこと/);
  });
});