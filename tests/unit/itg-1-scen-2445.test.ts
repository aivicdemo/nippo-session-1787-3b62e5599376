import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア順序付け機能', () => {
  // SCEN-2445: [error] 分析結果監査ログ記録機能 - 優先度判定ロジックのバージョンが未指定のとき、監査ログ記録が失敗する
  test('優先度判定ロジックのバージョンが未指定の場合、監査ログ記録が失敗しERR_AUDIT_VERSION_REQUIREDエラーが投げられる', () => {
    const reportId = 'report-2024-01-15-001';
    const approvalStatus = 'approved' as const;
    const approverUserId = 'user-manager-001';
    const versionId = null;

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockReturnValue({
        impact_score: 75,
        version_id: versionId,
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const approvalInput = {
      reportId,
      approvalStatus,
      approverUserId,
    };

    expect(() =>
      validateMonthlyReportApproval(approvalInput, mockTextAnalysisAdapter)
    ).toThrow(/ERR_AUDIT_VERSION_REQUIRED/);
  });
});