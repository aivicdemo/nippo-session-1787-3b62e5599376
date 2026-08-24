import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア順序付け', () => {
  // SCEN-2440
  test('分析結果監査ログ記録機能 - 判定に用いたデータ範囲（開始日）がnullのとき、監査ログ記録が失敗する', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['API遅延', 'DB接続エラー'],
        confidenceScores: [0.92, 0.85],
      }),
      assessImpactScore: jest.fn().mockRejectedValue(
        new Error('Invalid parameter: dataRangeStart cannot be null')
      ),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
        riskScore: 78,
      }),
    };

    const reportApprovalInput = {
      reportId: 'REPORT-2024-01',
      approvalStatus: 'approved' as const,
      approverUserId: 'USER-DEPT-MANAGER-001',
      dataRangeStart: null,
      dataRangeEnd: new Date('2024-01-31T23:59:59Z'),
      analysisExecutedAt: new Date('2024-02-01T10:00:00Z'),
      executedByUserId: 'USER-PM-001',
      priorityRuleVersion: '1.2.3',
    };

    const result = validateMonthlyReportApproval(
      reportApprovalInput,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toEqual({
      success: false,
      error: 'AUDIT_LOG_RECORDING_FAILED',
      reason: 'dataRangeStart is null',
      auditLogRecorded: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('AUDIT_LOG_RECORDING_FAILED');
    expect(result.auditLogRecorded).toBe(false);
  });
});