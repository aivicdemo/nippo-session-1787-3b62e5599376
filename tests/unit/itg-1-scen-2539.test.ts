import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2539: [edge] 初回テスト報告の入力検証機能 - ユーザー ID が有効な値である場合、ユーザー参照検証が合格となる
  test('有効なユーザーIDで検証パス時、ユーザー参照検証が合格となり報告送信が許可される', () => {
    // 前提: システムに登録済みの部員10名のいずれかのユーザーID
    const valid_user_id = 'user_001';
    const team_id = 'team_alpha';
    const report_date = '2024-01-15';
    const yesterday_accomplishment = 'データベース設計書を完成させた';
    const today_plan = 'テーブル定義に基づいてスキーマを実装する';
    const challenges = 'パフォーマンス要件の達成方法';

    const input: SubmitDailyReportInput = {
      userId: valid_user_id,
      teamId: team_id,
      yesterdayAccomplishment: yesterday_accomplishment,
      todayPlan: today_plan,
      challenges: challenges,
      reportDate: report_date,
    };

    // 手順: submitDailyReport 関数を呼び出し、有効なユーザーIDで報告を送信
    const result: SubmitDailyReportOutput = submitDailyReport(input);

    // 期待結果: ユーザーIDが有効な場合、reportId が返却され、
    // submissionTimestamp が ISO 8601 形式で記録され、
    // isWithinDeadline フラグが適切に設定される
    expect(result).toHaveProperty('reportId');
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    expect(result).toHaveProperty('submissionTimestamp');
    expect(typeof result.submissionTimestamp).toBe('string');
    // ISO 8601形式の妥当性確認 (YYYY-MM-DDTHH:mm:ss.sssZ パターン)
    expect(result.submissionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    expect(result).toHaveProperty('isWithinDeadline');
    expect(typeof result.isWithinDeadline).toBe('boolean');

    // ユーザーIDが有効であれば、検証が成功し報告送信が許可される
    // つまり結果オブジェクトが正常に返却される (例外がスローされない)
    expect(result).toBeDefined();
  });
});