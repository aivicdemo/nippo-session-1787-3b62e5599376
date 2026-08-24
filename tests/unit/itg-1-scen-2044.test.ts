import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2044: [error] 対策案・実行計画の必須項目検証 - 対策案の説明文が最大文字数を超えるとき検証エラーになる
  test('対策案の説明文が最大文字数を超える場合、バリデーションエラーが返される', () => {
    const excessiveTextLength = 2001;
    const excessiveDescriptionText = 'a'.repeat(excessiveTextLength);

    const input: SubmitDailyReportInput = {
      userId: 'user-123',
      teamId: 'team-456',
      yesterdayAccomplishment: '昨日は機能Aを実装しました',
      todayPlan: '今日は機能Bをテストします',
      challenges: '環境構築に時間がかかっている',
      reportDate: '2024-01-15',
      countermeasureDescription: excessiveDescriptionText,
    };

    expect(() => submitDailyReport(input)).toThrow(/対策案の説明文は.*文字以内/);
  });
});