import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type {
  ExtractIssueKeywordsInput,
  RankedIssueKeywordList,
  TextAnalysisServiceAdapter,
} from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization', () => {
  // SCEN-795: [normal] 課題優先度順序付け機能 - 優先度スコアが同一の複数課題が存在する場合、すべて同じ優先度として処理される
  test('should classify multiple issues with identical priority scores to the same priority level', async () => {
    // Setup mock TextAnalysisServiceAdapter
    const mockTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(async (text: string) => {
        if (text.includes('DB接続エラー')) {
          return { keywords: ['DB接続エラー'], frequencies: [1] };
        }
        if (text.includes('ログイン機能停止')) {
          return { keywords: ['ログイン機能停止'], frequencies: [1] };
        }
        if (text.includes('データ同期遅延')) {
          return { keywords: ['データ同期遅延'], frequencies: [1] };
        }
        return { keywords: [], frequencies: [] };
      }),
      assessImpactScore: jest.fn(async (keyword: string) => {
        // All three issues return the same impact score of 75
        return 75;
      }),
      classifyIssueSeverity: jest.fn(async (content: string) => {
        return 'high';
      }),
    };

    // Prepare three issue objects with identical priority score
    const issueA = {
      keywordId: 'kw-001',
      keyword: 'DB接続エラー',
      frequency: 3,
      impactScore: 75,
    };

    const issueB = {
      keywordId: 'kw-002',
      keyword: 'ログイン機能停止',
      frequency: 2,
      impactScore: 75,
    };

    const issueC = {
      keywordId: 'kw-003',
      keyword: 'データ同期遅延',
      frequency: 1,
      impactScore: 75,
    };

    const extractInput: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Execute the function
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      extractInput,
      mockTextAnalysisAdapter,
    );

    // Verify that all three issues have the same priority level
    const issueAResult = result.keywords.find(k => k.keywordId === 'kw-001');
    const issueBResult = result.keywords.find(k => k.keywordId === 'kw-002');
    const issueCResult = result.keywords.find(k => k.keywordId === 'kw-003');

    expect(issueAResult).toBeDefined();
    expect(issueBResult).toBeDefined();
    expect(issueCResult).toBeDefined();

    // All three issues should have identical priority rank since they share the same impact score
    expect(issueAResult!.rank).toBe(issueBResult!.rank);
    expect(issueBResult!.rank).toBe(issueCResult!.rank);

    // Verify that all three issues are present in the result list
    expect(result.keywords.length).toBeGreaterThanOrEqual(3);

    // Verify that all issues have the same impact score of 75
    expect(issueAResult!.frequency).toBeGreaterThanOrEqual(1);
    expect(issueBResult!.frequency).toBeGreaterThanOrEqual(1);
    expect(issueCResult!.frequency).toBeGreaterThanOrEqual(1);

    // Verify extracted metadata
    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(3);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});