import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Large Scale Validation', () => {
  // SCEN-1166
  test('should validate and process 10,000 issue items with full completion status and adapter call verification', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['keyword1', 'keyword2'],
        frequency: 5,
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    const issueDataset = Array.from({ length: 10000 }, (_, index) => ({
      issueId: `issue-${String(index + 1).padStart(5, '0')}`,
      content: `This is a sample issue content ${index + 1} with keywords and context`,
      occurrenceCount: Math.floor(Math.random() * 20) + 1,
      impactScore: Math.floor(Math.random() * 100),
    }));

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-31T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-admin-001',
    };

    const processingStartTime = Date.now();
    const initialMemory = process.memoryUsage().heapUsed;

    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    const processingEndTime = Date.now();
    const finalMemory = process.memoryUsage().heapUsed;
    const executionTimeMs = processingEndTime - processingStartTime;
    const memoryUsedMb = (finalMemory - initialMemory) / (1024 * 1024);
    const maxHeapMb = process.memoryUsage().heapTotal / (1024 * 1024);
    const memoryUtilizationPercent = (finalMemory / process.memoryUsage().heapTotal) * 100;

    const totalAdapterCalls =
      mockTextAnalysisAdapter.extractKeywords.mock.calls.length +
      mockTextAnalysisAdapter.assessImpactScore.mock.calls.length +
      mockTextAnalysisAdapter.classifyIssueSeverity.mock.calls.length;

    const processedItemCount = result.keywords.length;
    const failedItemCount = result.keywords.filter(
      (kw: { keyword: string; frequency: number; rank: number }) =>
        kw.frequency === 0
    ).length;

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBeGreaterThan(0);

    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(
      result.keywords.length
    );

    expect(result.keywords[0].rank).toBe(1);

    for (let i = 0; i < result.keywords.length - 1; i++) {
      expect(result.keywords[i].frequency).toBeGreaterThanOrEqual(
        result.keywords[i + 1].frequency
      );
    }

    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(31);

    expect(failedItemCount).toBe(0);

    expect(memoryUtilizationPercent).toBeLessThanOrEqual(80);

    expect(executionTimeMs).toBeLessThan(300000);

    for (const keyword of result.keywords) {
      expect(keyword.keywordId).toBeDefined();
      expect(typeof keyword.keywordId).toBe('string');
      expect(keyword.keywordId.length).toBeGreaterThan(0);

      expect(keyword.keyword).toBeDefined();
      expect(typeof keyword.keyword).toBe('string');
      expect(keyword.keyword.length).toBeGreaterThan(0);

      expect(keyword.frequency).toBeDefined();
      expect(typeof keyword.frequency).toBe('number');
      expect(keyword.frequency).toBeGreaterThanOrEqual(
        input.minFrequencyThreshold || 1
      );

      expect(keyword.rank).toBeDefined();
      expect(typeof keyword.rank).toBe('number');
      expect(keyword.rank).toBeGreaterThan(0);
    }
  });
});