import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';
import { type ExtractAndRankIssuesInput, type RankedIssueList } from '../../src/logic/issue-extraction-and-ranking';

describe('Issue Extraction and Ranking', () => {
  // SCEN-529
  test('should return empty ranked issue list when reports array is empty', () => {
    const testStartDate = new Date('2026-01-01T00:00:00Z');
    const testEndDate = new Date('2026-01-31T23:59:59Z');
    const beforeExecution = new Date();

    const input: ExtractAndRankIssuesInput = {
      reports: [],
      analysisStartDate: testStartDate,
      analysisEndDate: testEndDate,
      minimumConfidenceThreshold: 50,
    };

    const result: RankedIssueList = extractAndRankIssuesFromReports(input);

    const afterExecution = new Date();

    expect(result.issues).toEqual([]);
    expect(result.totalIssueCount).toBe(0);
    expect(result.lowConfidenceIssueCount).toBe(0);
    expect(result.analysisTimestamp).toBeInstanceOf(Date);
    expect(result.analysisTimestamp.getTime()).toBeGreaterThanOrEqual(beforeExecution.getTime());
    expect(result.analysisTimestamp.getTime()).toBeLessThanOrEqual(afterExecution.getTime() + 1000);
  });
});