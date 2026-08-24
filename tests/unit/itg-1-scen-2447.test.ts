import { describe, test, expect } from '@jest/globals';
import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  test('SCEN-2447: 優先度判定ロジックのバージョンが空文字列のとき、監査ログ記録が失敗する', () => {
    const testAuditLogInput = {
      reportId: 'report-20240115-001',
      approvalStatus: 'approved' as const,
      approverUserId: 'user-manager-001',
      executionDateTime: new Date('2024-01-15T10:00:00Z'),
      judgmentLogicVersion: '',
      priorityJudgmentResult: {
        keywordExtracted: ['バグ修正遅延', 'テスト不足'],
        impactScores: [78, 65],
        priorityRank: 'high' as const,
      },
    };

    expect(() => {
      validateMonthlyReportApproval(testAuditLogInput);
    }).toThrow(/バージョン/);
  });
});