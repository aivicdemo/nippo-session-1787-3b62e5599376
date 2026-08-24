import { describe, test, expect, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - extractAndRankIssueKeywords', () => {
  test('SCEN-1054: TextAnalysisServiceAdapter timeout exceeds 30 seconds and throws error', async () => {
    const reportingDate = new Date('2024-01-15T09:00:00Z');
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(
                new Error(
                  'API呼び出しが30秒を超過しました'
                )
              );
            }, 31000);
          })
      ),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: startDate,
      endDate: endDate,
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    const mockReportData = [
      {
        reportId: 'report-001',
        reporterUserId: 'user-engineer-001',
        reportingDate: reportingDate,
        yesterdayAccomplishment:
          '機能Aを実装',
        todayPlan: '機能Bをテスト予定',
        challenges:
          'データベース接続のタイムアウトが頻発している',
      },
    ];

    await expect(
      (async () => {
        try {
          const result = await extractAndRankIssueKeywords(
            input,
            mockReportData,
            mockTextAnalysisAdapter
          );
          return result;
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes('30秒を超過')
          ) {
            throw error;
          }
          throw error;
        }
      })()
    ).rejects.toThrow(/30秒を超過/);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
  });
});