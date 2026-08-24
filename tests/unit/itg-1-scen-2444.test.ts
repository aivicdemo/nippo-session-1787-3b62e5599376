import { describe, test, expect } from '@jest/globals';
import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  test('SCEN-2444: 分析結果監査ログ記録機能 - 終了日が空文字列のとき監査ログ記録が失敗する', () => {
    const analysisStartDate = '2026-01-01';
    const analysisEndDate = '';
    const reportId = 'report-test-001';
    const approvalStatus = 'approved' as const;
    const approverUserId = 'user-dept-head-001';

    const mockMonthlyReportApprovalInput = {
      reportId,
      approvalStatus,
      approverUserId,
    };

    expect(() =>
      validateMonthlyReportApproval(
        mockMonthlyReportApprovalInput,
        analysisStartDate,
        analysisEndDate
      )
    ).toThrow(/終了日/);
  });
});