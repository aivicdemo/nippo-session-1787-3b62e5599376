import { submitDailyReport } from '../../src/logic/daily-report-management';
import type {
  SubmitDailyReportInput,
  SubmitDailyReportOutput,
} from '../../src/logic/daily-report-management';

describe('部長向けダッシュボードのリアルタイム報告提出状況表示', () => {
  // SCEN-249: [normal] 報告遅延判定機能 - 報告送信時刻が期限を超過した場合、遅延フラグが true で記録される
  test('報告送信時刻が期限を超過した場合、遅延フラグがtrueで記録されることを検証する', async () => {
    const userId = 'engineer-001';
    const teamId = 'team-alpha';
    const reportDate = '2024-01-15';
    const yesterdayAccomplishment = 'データベース最適化を完了';
    const todayPlan = 'API開発仕様書の作成';
    const challenges = 'テスト環境のメモリ不足';

    // 期限時刻: 09:00
    const reportingDeadlineTime = new Date('2024-01-15T09:00:00Z');

    // システム時刻を期限より30分後（09:30）に設定
    const submissionTimestampAfterDeadline = new Date(
      '2024-01-15T09:30:00Z'
    );

    const submitInput: SubmitDailyReportInput = {
      userId,
      teamId,
      yesterdayAccomplishment,
      todayPlan,
      challenges,
      reportDate,
    };

    // モック: 現在時刻を期限超過時刻に固定
    const originalNow = Date.now;
    Date.now = jest.fn(() => submissionTimestampAfterDeadline.getTime());

    try {
      // 送信実行
      const result: SubmitDailyReportOutput = await submitDailyReport(
        submitInput,
        submissionTimestampAfterDeadline,
        reportingDeadlineTime
      );

      // 期待結果: 遅延フラグがtrueで記録されている
      expect(result.isWithinDeadline).toBe(false);

      // その他のフラグは期限超過の有無に関わらず影響を受けないことを確認
      expect(result.reportId).toBeDefined();
      expect(typeof result.reportId).toBe('string');
      expect(result.reportId.length).toBeGreaterThan(0);

      expect(result.submissionTimestamp).toBe(
        submissionTimestampAfterDeadline.toISOString()
      );
    } finally {
      // モック復元
      Date.now = originalNow;
    }
  });
});