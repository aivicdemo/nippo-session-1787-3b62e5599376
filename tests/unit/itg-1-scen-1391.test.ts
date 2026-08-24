import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('extractAndRankIssueKeywords - 日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  let mockTextAnalysisAdapter: any;

  beforeEach(() => {
    mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        const keywordMap: Record<string, number> = {
          'DB接続エラー': 1,
        };
        const results: Array<{ keyword: string; frequency: number }> = [];
        for (const [keyword, freq] of Object.entries(keywordMap)) {
          if (text.toLowerCase().includes(keyword.toLowerCase())) {
            results.push({ keyword, frequency: freq });
          }
        }
        return Promise.resolve(results);
      }),
      assessImpactScore: jest.fn((_keyword: string) => {
        return Promise.resolve(72);
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1391: [edge] 重複課題の自動判定と統合機能 - 複数課題が報告された日付が月末を含む場合、統合判定が日付に依存しない
  it('should unify duplicate issue keywords across month-end dates without date dependency', async () => {
    const reportDataList = [
      {
        id: 'report-1',
        teamId: 'team-001',
        userId: 'user-001',
        yesterdayContent: '',
        todayContent: '',
        issueContent: 'DB接続エラーが発生した',
        submittedAt: '2026-01-30T09:00:00Z',
      },
      {
        id: 'report-2',
        teamId: 'team-001',
        userId: 'user-002',
        yesterdayContent: '',
        todayContent: '',
        issueContent: 'DB接続エラーが発生した',
        submittedAt: '2026-01-31T09:00:00Z',
      },
      {
        id: 'report-3',
        teamId: 'team-001',
        userId: 'user-003',
        yesterdayContent: '',
        todayContent: '',
        issueContent: 'DB接続エラーが発生した',
        submittedAt: '2026-02-01T09:00:00Z',
      },
    ];

    const input: ExtractIssueKeywordsInput = {
      reportDataList,
      analysisStartDate: '2026-01-30',
      analysisEndDate: '2026-02-01',
      minFrequencyThreshold: 1,
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0].keyword).toBe('DB接続エラー');
    expect(result.keywords[0].frequency).toBe(3);
    expect(result.keywords[0].priorityScore).toBe(72);
    expect(result.keywords[0].priorityColor).toMatch(/^(red|yellow|green)$/);

    expect(result.totalIssueCount).toBe(3);
    expect(result.analysisExecutedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(3);
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledTimes(1);
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledWith('DB接続エラー');

    const extractCalls = mockTextAnalysisAdapter.extractKeywords.mock.calls;
    expect(extractCalls[0][0]).toContain('DB接続エラー');
    expect(extractCalls[1][0]).toContain('DB接続エラー');
    expect(extractCalls[2][0]).toContain('DB接続エラー');
  });
});