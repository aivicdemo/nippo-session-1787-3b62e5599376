import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-1203
  test('should extract and rank keywords from 100 daily reports with correct frequency ordering and performance metrics', async () => {
    const startDate = new Date('2024-01-15T00:00:00Z');
    const endDate = new Date('2024-01-15T23:59:59Z');
    const teamId = 'team-001';
    const requestUserId = 'user-manager-001';

    // Mock TextAnalysisServiceAdapter
    let apiCallCount = 0;
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async (reportText: string) => {
        apiCallCount++;
        // Simulate keyword extraction from report text
        // Pattern: each report contains 1-3 keywords with varying frequencies
        if (reportText.includes('サーバーダウン')) {
          return { keywords: ['サーバーダウン'], frequencies: [1] };
        }
        if (reportText.includes('ネットワーク遅延')) {
          return { keywords: ['ネットワーク遅延'], frequencies: [1] };
        }
        if (reportText.includes('データベース接続エラー')) {
          return { keywords: ['データベース接続エラー'], frequencies: [1] };
        }
        if (reportText.includes('ドキュメント作成')) {
          return { keywords: ['ドキュメント作成'], frequencies: [1] };
        }
        if (reportText.includes('テスト環境不安定')) {
          return { keywords: ['テスト環境不安定'], frequencies: [1] };
        }
        return { keywords: [], frequencies: [] };
      }),
      assessImpactScore: jest.fn(async () => ({ impactScore: 50 })),
      classifyIssueSeverity: jest.fn(async () => ({ severity: 'medium' })),
    };

    // Prepare 100 test reports with distributed keywords
    // Keywords distribution:
    // - サーバーダウン: 15 reports
    // - ネットワーク遅延: 12 reports
    // - データベース接続エラー: 10 reports
    // - テスト環境不安定: 8 reports
    // - ドキュメント作成: 1 report (minimum)
    // Total: 46 reports + 54 empty reports = 100 reports
    const testReports: string[] = [];

    for (let i = 0; i < 15; i++) {
      testReports.push(`Report ${i}: サーバーダウン occurred at ${new Date().toISOString()}`);
    }
    for (let i = 15; i < 27; i++) {
      testReports.push(`Report ${i}: ネットワーク遅延 detected during test`);
    }
    for (let i = 27; i < 37; i++) {
      testReports.push(`Report ${i}: データベース接続エラー in production`);
    }
    for (let i = 37; i < 45; i++) {
      testReports.push(`Report ${i}: テスト環境不安定 affecting team`);
    }
    for (let i = 45; i < 46; i++) {
      testReports.push(`Report ${i}: ドキュメント作成 in progress`);
    }
    for (let i = 46; i < 100; i++) {
      testReports.push(`Report ${i}: Routine maintenance tasks`);
    }

    // Measure performance
    const memoryBefore = process.memoryUsage().heapUsed;
    const timeStart = Date.now();

    // Execute function
    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter as any
    );

    const timeEnd = Date.now();
    const memoryAfter = process.memoryUsage().heapUsed;
    const processingTime = timeEnd - timeStart;
    const memoryDelta = memoryAfter - memoryBefore;

    // Verify API call count
    expect(apiCallCount).toBe(100);

    // Verify result structure
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.totalKeywordCount).toBeDefined();
    expect(result.extractedAt).toBeDefined();
    expect(result.analysisperiodDays).toBeDefined();

    // Verify extraction period
    expect(result.analysisperiodDays).toBe(1);

    // Verify keywords are sorted by frequency in descending order
    const keywordFrequencies = result.keywords.map(kw => kw.frequency);
    for (let i = 0; i < keywordFrequencies.length - 1; i++) {
      expect(keywordFrequencies[i]).toBeGreaterThanOrEqual(keywordFrequencies[i + 1]);
    }

    // Verify ranking is correct (1-indexed)
    result.keywords.forEach((keyword, index) => {
      expect(keyword.rank).toBe(index + 1);
    });

    // Verify top keyword (highest frequency)
    const topKeyword = result.keywords[0];
    expect(topKeyword.keyword).toBe('サーバーダウン');
    expect(topKeyword.frequency).toBe(15);
    expect(topKeyword.rank).toBe(1);

    // Verify minimum frequency keyword
    const minKeyword = result.keywords[result.keywords.length - 1];
    expect(minKeyword.keyword).toBe('ドキュメント作成');
    expect(minKeyword.frequency).toBe(1);

    // Verify performance metrics
    expect(processingTime).toBeLessThan(30000); // Less than 30 seconds
    expect(memoryDelta).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase

    // Verify total keyword count
    expect(result.totalKeywordCount).toBe(5); // 5 unique keywords found

    // Verify keyword properties
    result.keywords.forEach((keyword) => {
      expect(keyword.keywordId).toBeDefined();
      expect(typeof keyword.keywordId).toBe('string');
      expect(keyword.keyword).toBeDefined();
      expect(typeof keyword.keyword).toBe('string');
      expect(keyword.frequency).toBeGreaterThan(0);
      expect(typeof keyword.frequency).toBe('number');
      expect(keyword.rank).toBeGreaterThan(0);
      expect(typeof keyword.rank).toBe('number');
    });

    // Verify extracted timestamp is within expected range
    const extractedTime = new Date(result.extractedAt);
    expect(extractedTime.getTime()).toBeGreaterThanOrEqual(timeStart);
    expect(extractedTime.getTime()).toBeLessThanOrEqual(timeEnd + 1000); // Allow 1 second tolerance
  });
});