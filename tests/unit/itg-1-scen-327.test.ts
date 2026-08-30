import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';
import type { ExtractAndRankIssuesInput } from '../../src/logic/issue-extraction-and-ranking';

describe('朝会報告管理システム - 課題抽出・優先度ランク付け', () => {
  // SCEN-327
  test('チーム総人数が0以下のときにエラーをスロー', () => {
    const input: ExtractAndRankIssuesInput = {
      reports: [
        {
          reportId: 'report-001',
          reportDate: new Date('2024-01-15'),
          issueText: 'バグが発生しました',
          teamId: 'team-001',
        },
        {
          reportId: 'report-002',
          reportDate: new Date('2024-01-15'),
          issueText: '遅延が発生しています',
          teamId: 'team-001',
        },
        {
          reportId: 'report-003',
          reportDate: new Date('2024-01-15'),
          issueText: 'リソース不足です',
          teamId: 'team-001',
        },
        {
          reportId: 'report-004',
          reportDate: new Date('2024-01-15'),
          issueText: '依存関係の問題があります',
          teamId: 'team-001',
        },
        {
          reportId: 'report-005',
          reportDate: new Date('2024-01-15'),
          issueText: 'バグが多発しています',
          teamId: 'team-001',
        },
        {
          reportId: 'report-006',
          reportDate: new Date('2024-01-15'),
          issueText: '遅延が継続しています',
          teamId: 'team-001',
        },
        {
          reportId: 'report-007',
          reportDate: new Date('2024-01-15'),
          issueText: 'パフォーマンス低下の懸念',
          teamId: 'team-001',
        },
        {
          reportId: 'report-008',
          reportDate: new Date('2024-01-15'),
          issueText: 'テスト環境が不安定です',
          teamId: 'team-001',
        },
        {
          reportId: 'report-009',
          reportDate: new Date('2024-01-15'),
          issueText: 'ビルド失敗が発生しました',
          teamId: 'team-001',
        },
        {
          reportId: 'report-010',
          reportDate: new Date('2024-01-15'),
          issueText: 'デプロイ遅延があります',
          teamId: 'team-001',
        },
      ],
      analysisStartDate: new Date('2024-01-15'),
      analysisEndDate: new Date('2024-01-15'),
      minimumConfidenceThreshold: 50,
    };

    expect(() => extractAndRankIssuesFromReports(input, 0)).toThrow(/チーム人数/);
  });
});