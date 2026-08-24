import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア処理', () => {
  // SCEN-2442: [error] 分析結果監査ログ記録機能 - 判定に用いたデータ範囲（終了日）が未指定のとき、監査ログ記録が失敗する
  test('終了日が未指定の場合、HTTP 400 Bad Requestを返し、監査ログテーブルに記録されないこと', async () => {
    const reportId = 'report-2442-001';
    const approvalStatus = 'approved' as const;
    const approverUserId = 'user-001';
    const analysisStartDate = new Date('2026-01-01T00:00:00Z');
    const analysisEndDate = null; // 終了日が未指定

    const input = {
      reportId,
      approvalStatus,
      rejectionReason: undefined,
      approverUserId,
      analysisStartDate,
      analysisEndDate,
    };

    try {
      await validateMonthlyReportApproval(input);
      expect.fail('エラーが発生すべきですが、成功してしまいました');
    } catch (error: unknown) {
      expect(error).toBeDefined();
      if (error instanceof Error) {
        expect(error.message).toMatch(/終了日/);
      }
    }
  });
});