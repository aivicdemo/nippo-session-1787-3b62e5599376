import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-2428: [normal] 分析結果確定監査ログ記録機能 - 分析対象データ範囲（開始日時・終了日時）が監査ログに記録される
  test('分析対象データの範囲が監査ログに正確に記録される', () => {
    const analysisStartDate = new Date('2026-08-19T00:00:00Z');
    const analysisEndDate = new Date('2026-08-19T23:59:59Z');
    const analyzedReportCount = 3;
    const reportIds = ['report-001', 'report-002', 'report-003'];
    const executedByUserId = 'user-dept-manager-001';
    const analysisExecutionTime = new Date('2026-08-19T15:30:00Z');

    const result = validateMonthlyReportApproval({
      analysisStartDate,
      analysisEndDate,
      analyzedReportCount,
      reportIds,
      executedByUserId,
      analysisExecutionTime,
    });

    expect(result.isValid).toBe(true);
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.startDate).toEqual(analysisStartDate);
    expect(result.auditLog.endDate).toEqual(analysisEndDate);
    expect(result.auditLog.analyzedRecordCount).toBe(3);
    expect(result.auditLog.eventType).toBe('ANALYSIS_FINALIZED');
    expect(result.auditLog.timestamp).toEqual(analysisExecutionTime);
    expect(result.auditLog.userId).toBe('user-dept-manager-001');
  });
});