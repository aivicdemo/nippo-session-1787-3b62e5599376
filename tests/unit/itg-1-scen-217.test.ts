import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';
import { type Report, type RankedIssueList } from '../../src/logic/issue-extraction-and-ranking';

describe('Issue Extraction and Ranking - Edge Case: Unregistered Keyword Detection', () => {
  test('SCEN-217: should exclude unregistered keywords and return only dictionary-registered issues', () => {
    // Prepare test data
    const analysisStartDate = new Date('2024-12-15T00:00:00Z');
    const analysisEndDate = new Date('2025-01-13T23:59:59Z');

    const reports: Report[] = [
      {
        reportId: 'report-001',
        reportDate: new Date('2025-01-10T09:00:00Z'),
        issueText: 'バグが発生しました。ネットワーク遅延の影響でテストが失敗します。',
        teamId: 'team-alpha',
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2025-01-11T09:00:00Z'),
        issueText: 'ネットワーク遅延によりデプロイが遅延しています。',
        teamId: 'team-alpha',
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2025-01-12T09:00:00Z'),
        issueText: 'ネットワーク遅延と遅延が重なり、リソース不足が顕著です。',
        teamId: 'team-alpha',
      },
      {
        reportId: 'report-004',
        reportDate: new Date('2025-01-09T09:00:00Z'),
        issueText: 'バグ修正に依存関係の問題があります。',
        teamId: 'team-beta',
      },
    ];

    // Call the function
    const result: RankedIssueList = extractAndRankIssuesFromReports({
      reports,
      analysisStartDate,
      analysisEndDate,
      minimumConfidenceThreshold: 50,
    });

    // Verify that unregistered keyword 'ネットワーク遅延' is excluded
    const extractedKeywords = result.issues.map((issue) => issue.keyword);
    expect(extractedKeywords).not.toContain('ネットワーク遅延');

    // Verify only registered keywords are present
    expect(extractedKeywords).toContain('バグ');
    expect(extractedKeywords).toContain('遅延');
    expect(extractedKeywords).toContain('リソース不足');
    expect(extractedKeywords).toContain('依存関係');

    // Verify total issue count excludes unregistered keyword
    expect(result.totalIssueCount).toBe(4);

    // Verify low confidence issue count
    expect(result.lowConfidenceIssueCount).toBe(0);

    // Verify analysis timestamp is set
    expect(result.analysisTimestamp).toBeInstanceOf(Date);
    const timeDifference = Math.abs(
      new Date().getTime() - result.analysisTimestamp.getTime()
    );
    expect(timeDifference).toBeLessThan(5000); // Within 5 seconds

    // Verify each ranked issue has required fields
    result.issues.forEach((issue) => {
      expect(issue.issueId).toBeDefined();
      expect(typeof issue.issueId).toBe('string');
      expect(issue.keyword).toBeDefined();
      expect(typeof issue.keyword).toBe('string');
      expect(typeof issue.frequency).toBe('number');
      expect(typeof issue.impactScore).toBe('number');
      expect(typeof issue.priorityScore).toBe('number');
      expect(['高', '中', '低']).toContain(issue.priorityRank);
      expect(typeof issue.colorCode).toBe('string');
      expect(['red', 'yellow', 'green']).toContain(issue.colorCode);
      expect(typeof issue.confidenceScore).toBe('number');
      expect(typeof issue.affectedTeamCount).toBe('number');
    });
  });
});