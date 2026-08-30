import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';
import type { ExtractAndRankIssuesInput, RankedIssueList } from '../../src/logic/issue-extraction-and-ranking';

describe('extractAndRankIssuesFromReports', () => {
  test('SCEN-325: null および空文字列の issueText を持つ日報をスキップし、有効な課題のみ抽出・ランク付けして返す', () => {
    const analysisStartDate = new Date('2024-12-16T00:00:00Z');
    const analysisEndDate = new Date('2025-01-15T00:00:00Z');

    const reportData: ExtractAndRankIssuesInput = {
      reports: [
        {
          reportId: 'R001',
          reportDate: new Date('2025-01-15T09:00:00Z'),
          issueText: null as any,
          teamId: 'T001'
        },
        {
          reportId: 'R002',
          reportDate: new Date('2025-01-15T09:15:00Z'),
          issueText: '',
          teamId: 'T001'
        },
        {
          reportId: 'R003',
          reportDate: new Date('2025-01-15T09:30:00Z'),
          issueText: 'データベース接続エラーが発生',
          teamId: 'T001'
        },
        {
          reportId: 'R004',
          reportDate: new Date('2025-01-15T09:45:00Z'),
          issueText: null as any,
          teamId: 'T001'
        },
        {
          reportId: 'R005',
          reportDate: new Date('2025-01-15T10:00:00Z'),
          issueText: 'APIレスポンス遅延',
          teamId: 'T001'
        }
      ],
      analysisStartDate,
      analysisEndDate,
      minimumConfidenceThreshold: 50
    };

    const result: RankedIssueList = extractAndRankIssuesFromReports(reportData);

    expect(result.issues).toBeDefined();
    expect(Array.isArray(result.issues)).toBe(true);
    expect(result.issues.length).toBe(2);

    const keywordNames = result.issues.map(issue => issue.keyword);
    expect(keywordNames).toContain('DBエラー');
    expect(keywordNames).toContain('API遅延');

    expect(result.totalIssueCount).toBe(2);

    expect(result.analysisTimestamp).toBeDefined();
    expect(result.analysisTimestamp instanceof Date).toBe(true);
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - result.analysisTimestamp.getTime());
    expect(timeDiff).toBeLessThan(5000);

    expect(result.lowConfidenceIssueCount).toBe(0);

    result.issues.forEach(issue => {
      expect(issue.confidenceScore).toBeGreaterThanOrEqual(50);
    });
  });
});