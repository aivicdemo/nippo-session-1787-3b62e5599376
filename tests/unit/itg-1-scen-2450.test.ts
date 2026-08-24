import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア付けの監査ログ記録', () => {
  // SCEN-2450: [error] 分析結果監査ログ記録機能 - 前回との変更点が空文字列のとき、監査ログ記録が失敗する
  test('should reject audit log creation when changeDescription is empty string', () => {
    const reportId = 'report_monthly_2024_01';
    const approvalStatus = 'approved' as const;
    const approverUserId = 'user_department_head_001';
    const changeDescription = '';

    const input = {
      reportId,
      approvalStatus,
      approverUserId,
      changeDescription,
    };

    expect(() => {
      validateMonthlyReportApproval(input);
    }).toThrow(/変更点/);
  });
});