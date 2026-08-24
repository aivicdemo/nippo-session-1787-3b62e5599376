import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-2451: [error] 分析結果監査ログ記録機能 - データ範囲の終了日が開始日より前のとき、監査ログ記録が失敗する
  test('終了日が開始日より前の場合、監査ログ記録がエラーを返す', () => {
    const input = {
      reportId: 'RPT-2026-001',
      approvalStatus: 'approved' as const,
      approverUserId: 'USER-MANAGER-001',
      analysisStartDate: new Date('2026-01-31T00:00:00Z'),
      analysisEndDate: new Date('2026-01-01T23:59:59Z'),
    };

    expect(() => validateMonthlyReportApproval(input)).toThrow(/終了日は開始日より後/);
  });
});