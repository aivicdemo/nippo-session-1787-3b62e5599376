import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';
import type { ExtractAndRankIssuesInput } from '../../src/logic/issue-extraction-and-ranking';

describe('Issue Extraction and Ranking', () => {
  test('SCEN-220: Should throw NoReportsProvidedError when no reports are provided', () => {
    const analysisStartDate = new Date('2024-01-08T00:00:00Z');
    const analysisEndDate = new Date('2024-01-15T23:59:59Z');

    const input: ExtractAndRankIssuesInput = {
      reports: [],
      analysisStartDate,
      analysisEndDate,
      minimumConfidenceThreshold: 50,
    };

    expect(() => extractAndRankIssuesFromReports(input)).toThrow(/集約対象の日報が存在しません/);
  });
});