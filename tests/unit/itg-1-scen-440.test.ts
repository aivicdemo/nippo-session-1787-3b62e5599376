import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';
import { type Report } from '../../src/logic/issue-extraction-and-ranking';

describe('Issue Extraction and Ranking - Standard Keyword Dictionary Validation', () => {
  test('SCEN-440: should throw DataNormalizationFailureError when standard keyword dictionary is empty', () => {
    const analysisStartDate = new Date('2024-12-15T00:00:00Z');
    const analysisEndDate = new Date('2025-01-14T23:59:59Z');

    const reports: Report[] = [
      {
        reportId: 'report-001',
        reportDate: new Date('2025-01-14T09:00:00Z'),
        issueText: 'バグが多く発生しており、テストが失敗している状況です。',
        teamId: 'team-a',
      },
    ];

    const input = {
      reports: reports,
      analysisStartDate: analysisStartDate,
      analysisEndDate: analysisEndDate,
      standardKeywordDictionary: [],
      minimumConfidenceThreshold: 50,
    };

    expect(() => extractAndRankIssuesFromReports(input)).toThrow(/キーワード辞書が未設定です/);
  });
});