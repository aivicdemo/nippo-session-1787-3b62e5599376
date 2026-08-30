import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';
import type { ExtractAndRankIssuesInput } from '../../src/logic/issue-extraction-and-ranking';

describe('Issue Extraction and Ranking', () => {
  // SCEN-210
  test('should throw error when issue keyword dictionary is empty', () => {
    const thirtyDaysAgo = new Date('2024-01-01T00:00:00Z');
    const today = new Date('2024-01-31T00:00:00Z');

    const testReports = [
      {
        reportId: 'report-001',
        reportDate: new Date('2024-01-31T09:00:00Z'),
        issueText: 'バグが発生しました',
        teamId: 'team-001',
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2024-01-30T09:00:00Z'),
        issueText: 'デプロイの遅延があります',
        teamId: 'team-001',
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2024-01-29T09:00:00Z'),
        issueText: 'リソース不足で対応が困難です',
        teamId: 'team-001',
      },
    ];

    const input: ExtractAndRankIssuesInput = {
      reports: testReports,
      analysisStartDate: thirtyDaysAgo,
      analysisEndDate: today,
      minimumConfidenceThreshold: 50,
    };

    expect(() => extractAndRankIssuesFromReports(input)).toThrow(/キーワード/);
  });
});