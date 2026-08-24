import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-2437: [error] 分析結果監査ログ記録機能 - 実行者（プロジェクトマネージャーID）がnullのとき、監査ログ記録が失敗する
  test('実行者IDがnullのとき、監査ログ記録が失敗しエラーがスローされること', () => {
    const reportId = 'report-2024-01-15-001';
    const approvalStatus = 'approved' as const;
    const approverUserId = 'user-dept-manager-001';
    const executorUserId = null;

    expect(() =>
      validateMonthlyReportApproval({
        reportId,
        approvalStatus,
        approverUserId,
        executorUserId,
      })
    ).toThrow(/実行者ID|executor/i);
  });
});