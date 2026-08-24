import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア順序付け', () => {
  // SCEN-2454
  test('分析結果監査ログ記録機能 - 実行者のプロジェクトマネージャーIDが無効なユーザーIDのとき、監査ログ記録が失敗する', async () => {
    const invalidExecutorProjectManagerId = 'INVALID_PM_12345';
    
    const mockMonthlyReportApprovalInput = {
      reportId: 'REPORT_202401_001',
      approvalStatus: 'approved' as const,
      approverUserId: 'APPROVER_USER_001',
      executorProjectManagerId: invalidExecutorProjectManagerId,
      analysisTimestamp: new Date('2024-01-31T23:59:59Z'),
      dataQualityScore: 85,
      extractedKeywords: ['遅延', 'リスク'],
    };

    const result = await validateMonthlyReportApproval(mockMonthlyReportApprovalInput);

    expect(result).toEqual(
      expect.objectContaining({
        isValid: false,
        errorCode: 'INVALID_USER_ID',
        statusCode: 400,
        errorMessage: expect.stringContaining('ユーザーID'),
      })
    );

    expect(result.auditLogCreated).toBe(false);
  });
});