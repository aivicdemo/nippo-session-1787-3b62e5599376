import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-750
  test('集約日報データが null のとき、NullAggregatedReportError をスローする', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    mockTextAnalysisServiceAdapter.extractKeywords.mockImplementation(
      (aggregatedReportData: any) => {
        if (aggregatedReportData === null) {
          const error = new Error('集約日報データが存在しません。分析を中止します');
          (error as any).code = 'ERR_AGGREGATED_REPORT_NULL';
          (error as any).name = 'NullAggregatedReportError';
          throw error;
        }
        return [];
      }
    );

    expect(() => {
      extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);
    }).toThrow(/集約日報データ/);
  });
});