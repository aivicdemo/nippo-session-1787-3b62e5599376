import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度判定機能 - タイムアウト処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1330
  test('TextAnalysisServiceAdapter の extractKeywords が 30 秒超過のタイムアウトをシミュレートするとき、処理を中止し TimeoutException を発生させる', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('timeout exceeded 30 seconds'));
            }, 31000);
          })
      ),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    const dailyReports = [
      {
        reportId: 'rpt-001',
        content: {
          yesterdayAccomplishments: 'ユーザー認証APIの実装完了',
          todayPlans: 'テスト環境へのデプロイ実施',
          currentChallenges: 'データベース接続タイムアウトの問題が頻出',
        },
      },
      {
        reportId: 'rpt-002',
        content: {
          yesterdayAccomplishments: 'フロントエンドのレイアウト調整',
          todayPlans: 'E2Eテスト実装開始',
          currentChallenges: 'データベース接続タイムアウトの問題が再度発生',
        },
      },
    ];

    const promise = extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter, dailyReports);

    await expect(promise).rejects.toThrow(/timeout/i);
  });
});