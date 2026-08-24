import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信処理', () => {
  // SCEN-328: [edge] 日報入力バリデーション機能 - 昨日やったことが文字数制限上限ちょうどのとき入力ルールを満たす
  test('昨日やったことが文字数制限上限ちょうど（2000文字）の場合、バリデーションエラーなく送信が成功する', () => {
    // 準備: 昨日やったことを文字数制限上限ちょうどの2000文字に設定
    const yesterdayAccomplishment = 'a'.repeat(2000);
    
    // 準備: その他の必須項目を入力値として設定
    const input: SubmitDailyReportInput = {
      userId: 'test-user-001',
      teamId: 'team-dev-01',
      yesterdayAccomplishment: yesterdayAccomplishment,
      todayPlan: 'today task example',
      challenges: 'current challenge example',
      reportDate: '2024-01-15',
    };

    // 実行: submitDailyReport 関数を呼び出す
    const output: SubmitDailyReportOutput = submitDailyReport(input);

    // 検証: 送信が成功し、reportId が返される
    expect(output.reportId).toBeDefined();
    expect(typeof output.reportId).toBe('string');
    expect(output.reportId.length).toBeGreaterThan(0);

    // 検証: submissionTimestamp が ISO 8601形式で返される
    expect(output.submissionTimestamp).toBeDefined();
    expect(typeof output.submissionTimestamp).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(output.submissionTimestamp)).toBe(true);

    // 検証: isWithinDeadline フラグが boolean で返される
    expect(typeof output.isWithinDeadline).toBe('boolean');

    // 検証: バリデーションエラーが発生していない（送信完了）
    expect(output).toHaveProperty('reportId');
    expect(output).toHaveProperty('submissionTimestamp');
    expect(output).toHaveProperty('isWithinDeadline');
  });
});