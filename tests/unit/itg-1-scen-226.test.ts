import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';

describe('Issue Extraction and Ranking', () => {
  test('SCEN-226: when extracted keywords have confidence scores below the minimum threshold, returns empty issues list with low confidence count', async () => {
    const now = new Date('2024-02-15T10:00:00Z');
    const thirtyDaysAgo = new Date('2024-01-16T10:00:00Z');

    const mockReports = [
      {
        reportId: 'rep-001',
        reportDate: new Date('2024-02-15T08:00:00Z'),
        issueText: 'ビルドが遅延しており、リソース不足の状況です',
        teamId: 'team-001',
      },
      {
        reportId: 'rep-002',
        reportDate: new Date('2024-02-14T08:00:00Z'),
        issueText: '依存関係の問題で本日の予定に影響があります',
        teamId: 'team-001',
      },
      {
        reportId: 'rep-003',
        reportDate: new Date('2024-02-13T08:00:00Z'),
        issueText: 'リソース不足により進捗が遅延しています',
        teamId: 'team-002',
      },
      {
        reportId: 'rep-004',
        reportDate: new Date('2024-02-12T08:00:00Z'),
        issueText: '依存関係を確認中です',
        teamId: 'team-001',
      },
      {
        reportId: 'rep-005',
        reportDate: new Date('2024-02-11T08:00:00Z'),
        issueText: 'ビルドエラーが発生しました',
        teamId: 'team-002',
      },
      {
        reportId: 'rep-006',
        reportDate: new Date('2024-02-10T08:00:00Z'),
        issueText: 'チーム間の依存関係に問題があります',
        teamId: 'team-003',
      },
      {
        reportId: 'rep-007',
        reportDate: new Date('2024-02-09T08:00:00Z'),
        issueText: 'テスト環境でリソース不足です',
        teamId: 'team-001',
      },
      {
        reportId: 'rep-008',
        reportDate: new Date('2024-02-08T08:00:00Z'),
        issueText: '進捗が遅延しています',
        teamId: 'team-002',
      },
      {
        reportId: 'rep-009',
        reportDate: new Date('2024-02-07T08:00:00Z'),
        issueText: 'ビルド環境の依存関係を修正中です',
        teamId: 'team-003',
      },
      {
        reportId: 'rep-010',
        reportDate: new Date('2024-02-06T08:00:00Z'),
        issueText: 'リソース計画の見直しが必要です',
        teamId: 'team-001',
      },
      {
        reportId: 'rep-011',
        reportDate: new Date('2024-02-05T08:00:00Z'),
        issueText: '遅延に対応中です',
        teamId: 'team-002',
      },
      {
        reportId: 'rep-012',
        reportDate: new Date('2024-02-04T08:00:00Z'),
        issueText: 'リソース不足の影響を受けています',
        teamId: 'team-001',
      },
      {
        reportId: 'rep-013',
        reportDate: new Date('2024-02-03T08:00:00Z'),
        issueText: '依存関係の解決が急務です',
        teamId: 'team-003',
      },
      {
        reportId: 'rep-014',
        reportDate: new Date('2024-02-02T08:00:00Z'),
        issueText: 'ビルド遅延が続いています',
        teamId: 'team-002',
      },
      {
        reportId: 'rep-015',
        reportDate: new Date('2024-02-01T08:00:00Z'),
        issueText: 'リソース不足のため予定変更が必要です',
        teamId: 'team-001',
      },
      {
        reportId: 'rep-016',
        reportDate: new Date('2024-01-31T08:00:00Z'),
        issueText: '遅延リスクが高まっています',
        teamId: 'team-002',
      },
      {
        reportId: 'rep-017',
        reportDate: new Date('2024-01-30T08:00:00Z'),
        issueText: '依存関係による遅延が懸念されます',
        teamId: 'team-003',
      },
      {
        reportId: 'rep-018',
        reportDate: new Date('2024-01-29T08:00:00Z'),
        issueText: 'リソース調整中です',
        teamId: 'team-001',
      },
      {
        reportId: 'rep-019',
        reportDate: new Date('2024-01-28T08:00:00Z'),
        issueText: 'ビルド問題と遅延が並行して発生しています',
        teamId: 'team-002',
      },
      {
        reportId: 'rep-020',
        reportDate: new Date('2024-01-27T08:00:00Z'),
        issueText: '依存関係とリソース不足の複合課題です',
        teamId: 'team-003',
      },
    ];

    const minimumConfidenceThreshold = 60;

    const result = await extractAndRankIssuesFromReports({
      reports: mockReports,
      analysisStartDate: thirtyDaysAgo,
      analysisEndDate: now,
      minimumConfidenceThreshold: minimumConfidenceThreshold,
    });

    expect(result.issues).toEqual([]);
    expect(result.totalIssueCount).toBe(0);
    expect(result.lowConfidenceIssueCount).toBe(3);
    expect(result.analysisTimestamp).toBeInstanceOf(Date);
  });
});