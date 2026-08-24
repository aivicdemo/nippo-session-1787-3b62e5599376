import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('monthly-performance-analysis: validateMonthlyReportApproval', () => {
  // SCEN-2469: [edge] 分析結果監査ログ記録機能 - 前回との変更点に重複する差分データが含まれた場合に重複を除外して記録される
  test('should remove duplicate keyword differences when recording audit log, keeping highest frequency value', () => {
    const currentAnalysisTimestamp = new Date('2024-01-15T10:30:00Z');
    const previousAnalysisTimestamp = new Date('2024-01-14T10:30:00Z');

    const reportId = 'report-2024-01-15';
    const approverUserId = 'user-dept-head-001';

    const previousAnalysisResult = {
      extractedAt: previousAnalysisTimestamp.toISOString(),
      keywordDifferences: [
        { keyword: '接続エラー', frequency: 1 },
        { keyword: 'メモリリーク', frequency: 2 }
      ]
    };

    const currentAnalysisResult = {
      extractedAt: currentAnalysisTimestamp.toISOString(),
      keywordDifferences: [
        { keyword: '接続エラー', frequency: 2 },
        { keyword: '接続エラー', frequency: 1 },
        { keyword: 'API遅延', frequency: 3 }
      ]
    };

    const approvalInput = {
      reportId: reportId,
      approvalStatus: 'approved' as const,
      approverUserId: approverUserId
    };

    const auditLogRecords: Array<{
      reportId: string;
      approverUserId: string;
      approvalStatus: string;
      processedAt: string;
      keywordDifferences: Array<{ keyword: string; frequency: number }>;
      deduplicationApplied: boolean;
    }> = [];

    const result = validateMonthlyReportApproval(
      approvalInput,
      {
        previousAnalysisResult: previousAnalysisResult,
        currentAnalysisResult: currentAnalysisResult,
        onAuditLogRecord: (record) => {
          auditLogRecords.push(record);
        }
      }
    );

    expect(result.isValid).toBe(true);
    expect(result.approvalStatus).toBe('approved');

    expect(auditLogRecords).toHaveLength(1);

    const auditLog = auditLogRecords[0];
    expect(auditLog.reportId).toBe(reportId);
    expect(auditLog.approverUserId).toBe(approverUserId);
    expect(auditLog.approvalStatus).toBe('approved');
    expect(auditLog.deduplicationApplied).toBe(true);

    const dedupedKeywords = auditLog.keywordDifferences;
    expect(dedupedKeywords).toHaveLength(2);

    const keywordMap = new Map<string, number>();
    dedupedKeywords.forEach(item => {
      keywordMap.set(item.keyword, item.frequency);
    });

    expect(keywordMap.get('接続エラー')).toBe(2);
    expect(keywordMap.get('API遅延')).toBe(3);
    expect(keywordMap.has('メモリリーク')).toBe(false);

    const processedAtDate = new Date(auditLog.processedAt);
    expect(processedAtDate.getTime()).toBeGreaterThanOrEqual(
      new Date('2024-01-15T10:00:00Z').getTime()
    );
    expect(processedAtDate.getTime()).toBeLessThanOrEqual(
      new Date('2024-01-15T12:00:00Z').getTime()
    );
  });
});