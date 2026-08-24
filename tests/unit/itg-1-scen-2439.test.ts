import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-2439: [error] 分析結果監査ログ記録機能 - 判定に用いたデータ範囲（開始日）が未指定のとき、監査ログ記録が失敗する
  test('should fail audit log recording when startDate is null', async () => {
    const invalidAnalysisDataRange = {
      startDate: null,
      endDate: '2026-08-19',
    };

    const reportInput = {
      reportId: 'RPT-2026-08-001',
      approvalStatus: 'approved' as const,
      approverUserId: 'USER-DEPT-LEAD-001',
    };

    expect(() => {
      validateMonthlyReportApproval(
        reportInput,
        invalidAnalysisDataRange
      );
    }).toThrow(/startDate/);
  });
});