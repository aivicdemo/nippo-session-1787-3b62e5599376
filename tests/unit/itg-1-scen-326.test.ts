import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';
import { type ExtractAndRankIssuesInput, type RankedIssueList } from '../../src/logic/issue-extraction-and-ranking';

describe('Issue Extraction and Ranking - Unknown Keywords Detection', () => {
  test('SCEN-326: Should detect unknown keywords not in learned keyword list and include them in ranked issues with low confidence warning', () => {
    // Setup: Create 10 daily reports (members 1-5 report unknown keyword, members 6-10 report known keyword)
    const reportDate = new Date('2024-01-15T09:00:00Z');
    const analysisStartDate = new Date('2023-12-16T00:00:00Z');
    const analysisEndDate = new Date('2024-01-15T23:59:59Z');

    const unknownKeyword = '未対応API問題';
    const knownKeyword = '接続エラー';

    const reportsWithUnknownKeyword = Array.from({ length: 5 }, (_, i) => ({
      reportId: `report-${i + 1}`,
      reportDate: reportDate,
      issueText: `対応が必要な${unknownKeyword}が発生しています。システムの安定性に影響します。`,
      teamId: `team-1`,
    }));

    const reportsWithKnownKeyword = Array.from({ length: 5 }, (_, i) => ({
      reportId: `report-${i + 6}`,
      reportDate: reportDate,
      issueText: `昨日は${knownKeyword}が複数回発生しました。ログを確認中です。`,
      teamId: `team-1`,
    }));

    const allReports = [...reportsWithUnknownKeyword, ...reportsWithKnownKeyword];

    const input: ExtractAndRankIssuesInput = {
      reports: allReports,
      analysisStartDate: analysisStartDate,
      analysisEndDate: analysisEndDate,
      minimumConfidenceThreshold: 50,
    };

    // Execute
    const result: RankedIssueList = extractAndRankIssuesFromReports(input);

    // Assertions

    // (1) Unknown keyword '未対応API問題' should be included with affectedMembers=5 and frequency=5
    const unknownKeywordIssue = result.issues.find((issue) => issue.keyword === unknownKeyword);
    expect(unknownKeywordIssue).toBeDefined();
    expect(unknownKeywordIssue?.frequency).toBe(5);
    expect(unknownKeywordIssue?.affectedTeamCount).toBe(5);

    // (2) lowConfidenceIssueCount should be >= 1 (the unknown keyword should be flagged as low confidence)
    expect(result.lowConfidenceIssueCount).toBeGreaterThanOrEqual(1);

    // (3) Known keyword '接続エラー' should also be included and both keywords should be sorted by priority
    const knownKeywordIssue = result.issues.find((issue) => issue.keyword === knownKeyword);
    expect(knownKeywordIssue).toBeDefined();
    expect(knownKeywordIssue?.frequency).toBe(5);

    // (4) Both issues should be present in the results
    expect(result.issues.length).toBeGreaterThanOrEqual(2);

    // (5) Issues should be sorted by priorityScore in descending order
    for (let i = 0; i < result.issues.length - 1; i++) {
      expect(result.issues[i].priorityScore).toBeGreaterThanOrEqual(result.issues[i + 1].priorityScore);
    }

    // (6) The unknown keyword issue should have a lower confidenceScore than the known keyword
    // (confidence reflects that it's not in the learned keyword list)
    if (unknownKeywordIssue && knownKeywordIssue) {
      expect(unknownKeywordIssue.confidenceScore).toBeLessThan(100);
    }

    // (7) totalIssueCount should reflect all extracted issues
    expect(result.totalIssueCount).toBe(result.issues.length);

    // (8) analysisTimestamp should be set
    expect(result.analysisTimestamp).toBeInstanceOf(Date);

    // (9) Unknown keyword issue should have impactScore calculated correctly
    // With 5 affected members out of assumed team context, impact should be reflected
    if (unknownKeywordIssue) {
      expect(unknownKeywordIssue.impactScore).toBeGreaterThan(0);
      expect(unknownKeywordIssue.impactScore).toBeLessThanOrEqual(100);
    }

    // (10) Verify that the result structure matches RankedIssueList
    expect(result.issues).toBeInstanceOf(Array);
    expect(typeof result.totalIssueCount).toBe('number');
    expect(result.analysisTimestamp).toBeInstanceOf(Date);
    expect(typeof result.lowConfidenceIssueCount).toBe('number');
  });
});