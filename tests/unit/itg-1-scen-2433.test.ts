import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('月次パフォーマンス分析 - 承認検証機能', () => {
  // SCEN-2433: [error] 分析結果監査ログ記録機能 - 確定日時が未指定のとき、監査ログ記録が失敗する
  test('confirmationDatetimeが未指定のとき、監査ログ記録がエラーで失敗する', () => {
    const input = {
      reportId: 'RPT20240101001',
      approvalStatus: 'approved' as const,
      approverUserId: 'user_admin_001',
      analysisId: 'ANA20240101001',
      userId: 'user_001',
      extractedKeywords: ['課題A', '課題B'],
      impactScore: 75,
      severity: 'high' as const,
      confirmationDatetime: null,
      createdAt: new Date('2024-01-01T09:00:00Z'),
    };

    expect(() => validateMonthlyReportApproval(input)).toThrow(/confirmationDatetime/);
  });
});