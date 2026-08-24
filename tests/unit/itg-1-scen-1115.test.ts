import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  let mockTextAnalysisServiceAdapter: any;

  beforeEach(() => {
    mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1115
  test('抽出課題データが複数件の場合、すべての件数の有効性検証を完了する', async () => {
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const teamId = 'team-001';
    const requestUserId = 'user-manager-001';

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    mockTextAnalysisServiceAdapter.extractKeywords.mockImplementation(
      (text: string) => {
        if (text.includes('DB接続タイムアウト')) {
          return { keywords: ['DB接続', 'タイムアウト'], frequency: 3 };
        }
        if (text.includes('API応答遅延')) {
          return { keywords: ['API応答', '遅延'], frequency: 2 };
        }
        if (text.includes('メモリリーク')) {
          return { keywords: ['メモリ', 'リーク'], frequency: 1 };
        }
        return { keywords: [], frequency: 0 };
      }
    );

    mockTextAnalysisServiceAdapter.assessImpactScore.mockImplementation(
      (keyword: string) => {
        const scoreMap: { [key: string]: number } = {
          'DB接続': 85,
          'タイムアウト': 80,
          'API応答': 75,
          '遅延': 70,
          'メモリ': 60,
          'リーク': 55,
        };
        return scoreMap[keyword] || 50;
      }
    );

    mockTextAnalysisServiceAdapter.classifyIssueSeverity.mockImplementation(
      (keyword: string) => {
        const severityMap: { [key: string]: string } = {
          'DB接続': '高',
          'タイムアウト': '高',
          'API応答': '中',
          '遅延': '中',
          'メモリ': '低',
          'リーク': '低',
        };
        return severityMap[keyword] || '低';
      }
    );

    const reportedIssues = [
      { issueId: 'issue-001', content: 'DB接続タイムアウトが頻発している' },
      { issueId: 'issue-002', content: 'API応答遅延が発生している' },
      { issueId: 'issue-003', content: 'メモリリークの兆候が見られる' },
    ];

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
      reportedIssues
    );

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBeGreaterThan(0);

    const allKeywords = result.keywords.map(k => k.keyword);
    expect(allKeywords).toContain('DB接続');
    expect(allKeywords).toContain('API応答');
    expect(allKeywords).toContain('メモリ');

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalled();

    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(3);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);

    const keywordsSortedByFrequency = result.keywords.slice(0, 3);
    for (let i = 1; i < keywordsSortedByFrequency.length; i++) {
      expect(keywordsSortedByFrequency[i - 1].frequency).toBeGreaterThanOrEqual(
        keywordsSortedByFrequency[i].frequency
      );
    }

    for (let i = 0; i < result.keywords.length; i++) {
      expect(result.keywords[i].rank).toBe(i + 1);
    }
  });
});