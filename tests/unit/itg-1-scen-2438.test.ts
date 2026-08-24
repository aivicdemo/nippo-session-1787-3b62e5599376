import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア順序付け表示機能', () => {
  // SCEN-2438: [error] 分析結果監査ログ記録機能 - 実行者（プロジェクトマネージャーID）が空文字列のとき、監査ログ記録が失敗する
  test('projectManagerIdが空文字列の場合、監査ログ記録がエラーで失敗し、エラーメッセージを返す', () => {
    const input = {
      reportId: 'report-2024-01',
      approvalStatus: 'approved' as const,
      approverUserId: 'user-dept-manager-001',
      projectManagerId: '',
      analysisType: 'keywordExtraction',
      analysisResult: {
        keywords: [{ term: '課題1', frequency: 2 }],
        impactScore: 45,
      },
      timestamp: '2024-01-15T10:30:00Z',
      executionStatus: 'completed',
    };

    expect(() => {
      validateMonthlyReportApproval(input);
    }).toThrow(/projectManagerId/);
  });
});