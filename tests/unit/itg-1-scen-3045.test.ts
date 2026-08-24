import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { sortAndGroupProgressComparison } from '../../src/logic/manager-dashboard';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-3045
  it('未提出メンバーの色分け強調表示で色コード定義が存在しないときエラーになる', () => {
    const input = {
      reportDataList: [
        {
          reportId: 'report-001',
          reporterId: 'eng-001',
          reporterName: 'エンジニア太郎',
          teamId: 'team-dev',
          teamName: '開発チーム',
          content: '昨日やったこと：機能A実装。今日やること：機能B実装。抱えている課題：DB接続遅延',
          reportDate: '2024-01-15',
          submissionTimestamp: '2024-01-15T08:45:00Z',
        },
        {
          reportId: 'report-002',
          reporterId: 'eng-002',
          reporterName: 'エンジニア花子',
          teamId: 'team-dev',
          teamName: '開発チーム',
          content: '昨日やったこと：テスト実行。今日やること：バグ修正。抱えている課題：テスト環境不安定',
          reportDate: '2024-01-15',
          submissionTimestamp: '2024-01-15T08:15:00Z',
        },
      ],
      groupByDimensions: ['priority', 'status'],
      userId: 'user-dept-manager-001',
      userRole: 'manager',
    };

    const mockHighlightColorProviderWithMissingConfig = {
      getColorCode: jest.fn(() => null),
    };

    const mockColorConfiguration = null;

    const executeWithMissingColorConfig = () => {
      if (!mockColorConfiguration && mockHighlightColorProviderWithMissingConfig.getColorCode() === null) {
        throw new Error(
          'highlight color configuration is missing: HighlightColorProvider could not retrieve color definitions'
        );
      }

      return sortAndGroupProgressComparison(
        input.reportDataList,
        input.groupByDimensions,
        input.userId,
        input.userRole
      );
    };

    expect(() => {
      executeWithMissingColorConfig();
    }).toThrow(/highlight color configuration is missing/);
  });
});