import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  test('SCEN-2471: 分析結果監査ログ記録機能 - 実行者ユーザーIDが業務上の最大文字数で記録される', async () => {
    // 実行者ユーザーID（業務上の最大文字数255文字）を準備
    const maxLengthUserId = 'a'.repeat(255);
    const reportId = 'report-20240115-001';
    const approverUserId = 'manager-001';

    // 入力データを構築
    const approvalInput = {
      reportId: reportId,
      approvalStatus: 'approved' as const,
      approverUserId: approverUserId,
    };

    // TextAnalysisServiceAdapterをスタブ化
    const textAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: '課題A',
            frequency: 1,
            confidence: 0.95,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high' as const,
      }),
    };

    // 監査ログ格納用
    const auditLog = {
      executor_user_id: maxLengthUserId,
      report_id: reportId,
      approval_status: 'approved',
      processed_at: new Date('2024-01-15T11:00:00Z'),
    };

    // validateMonthlyReportApprovalを実行
    const result = await validateMonthlyReportApproval(
      approvalInput,
      textAnalysisServiceAdapter,
      {
        recordAuditLog: jest.fn().mockResolvedValue({
          auditLogId: 'audit-001',
          executorUserId: maxLengthUserId,
          recordedAt: new Date('2024-01-15T11:00:00Z'),
        }),
      },
      maxLengthUserId
    );

    // 監査ログレコードの『executor_user_id』カラムの値と文字数を確認
    expect(auditLog.executor_user_id).toBe(maxLengthUserId);
    expect(auditLog.executor_user_id.length).toBe(255);
    expect(result.reportId).toBe(reportId);
    expect(result.approvalStatus).toBe('approved');
    expect(result.processedAt).toEqual(new Date('2024-01-15T11:00:00Z'));
  });
});