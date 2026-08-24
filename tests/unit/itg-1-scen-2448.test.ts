import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート承認検証機能', () => {
  // SCEN-2448: [error] 分析結果監査ログ記録機能 - 前回との変更点が未指定のとき、監査ログ記録が失敗する
  test('前回との変更点が未指定の場合、監査ログ記録がエラーで失敗する', () => {
    const reportId = 'report-2024-01-monthly-001';
    const approverUserId = 'user-manager-001';
    const approvalStatus = 'approved' as const;
    const previousChangesDiff = undefined;

    const result = validateMonthlyReportApproval(
      reportId,
      approvalStatus,
      approverUserId,
      previousChangesDiff
    );

    expect(result).toEqual({
      isValid: false,
      code: 'MISSING_CHANGE_DIFF',
      message: '前回との変更点が指定されていません'
    });
  });
});