import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア機能', () => {
  // SCEN-2435: [error] 分析結果監査ログ記録機能 - 確定日時が空文字列のとき、監査ログ記録が失敗する
  test('should throw validation error when confirmedAt is empty string', () => {
    const input = {
      reportId: 'report-001',
      approvalStatus: 'approved' as const,
      rejectionReason: undefined,
      approverUserId: 'user-dept-head-001',
      confirmedAt: '',
      userId: 'user-pm-001',
      reportContent: {
        summary: 'Weekly performance analysis for team A',
        extractedKeywords: ['delay', 'resource_constraint', 'quality_issue'],
        priorityScores: [
          { keyword: 'delay', score: 85 },
          { keyword: 'resource_constraint', score: 72 },
          { keyword: 'quality_issue', score: 68 }
        ]
      }
    };

    expect(() => validateMonthlyReportApproval(input)).toThrow(/確定日時/);
  });
});