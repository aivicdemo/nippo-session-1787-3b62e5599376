import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - TextAnalysisServiceAdapter Resilience', () => {
  // SCEN-3077
  test('should mark analysis as failed when TextAnalysisServiceAdapter returns out-of-range impact scores', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: '納期遅延', frequency: 1 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(150), // Out of range: > 100
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);

    expect(result).toHaveProperty('analysisStatus');
    expect(result.analysisStatus).toBe('failed');
    expect(result).toHaveProperty('fallbackMessage');
    expect(result.fallbackMessage).toMatch(/課題分析が一時的に利用できません/);
    expect(result).toHaveProperty('shouldUseCachedResults');
  });

  test('should handle negative impact score from TextAnalysisServiceAdapter', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: '品質問題', frequency: 2 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(-50), // Out of range: < 0
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-002',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-002',
    };

    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);

    expect(result.analysisStatus).toBe('failed');
    expect(result.shouldFallbackToManualInput).toBe(true);
    expect(result).not.toHaveProperty('keywords');
  });

  test('should handle non-numeric impact score string from TextAnalysisServiceAdapter', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'システム障害', frequency: 1 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue('invalid' as any), // String instead of number
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-003',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-21T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-003',
    };

    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);

    expect(result.analysisStatus).toBe('failed');
    expect(result.fallbackMessage).toMatch(/手動入力/);
    expect(result.keywords).toBeUndefined();
  });

  test('should handle null impact score from TextAnalysisServiceAdapter', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'リソース不足', frequency: 1 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(null as any), // null value
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-004',
      startDate: new Date('2024-02-01T00:00:00Z'),
      endDate: new Date('2024-02-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-004',
    };

    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);

    expect(result.analysisStatus).toBe('failed');
    expect(result.shouldUseCachedResults).toBeDefined();
  });

  test('should handle undefined impact score from TextAnalysisServiceAdapter', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'コミュニケーション', frequency: 1 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(undefined as any), // undefined value
      classifyIssueSeverity: jest.fn().mockResolvedValue('low'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-005',
      startDate: new Date('2024-01-22T00:00:00Z'),
      endDate: new Date('2024-01-28T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-005',
    };

    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);

    expect(result.analysisStatus).toBe('failed');
    expect(result.fallbackMessage).toMatch(/課題分析が一時的に利用できません/);
  });

  test('should accept valid impact score within 0-100 range from TextAnalysisServiceAdapter', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'プロジェクト遅延', frequency: 1, keywordId: 'kw-001' },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(75), // Valid: 0 <= score <= 100
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-006',
      startDate: new Date('2024-01-29T00:00:00Z'),
      endDate: new Date('2024-02-04T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-006',
    };

    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);

    expect(result.analysisStatus).toBe('success');
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords!.length).toBeGreaterThan(0);
    expect(result.keywords![0].keyword).toBe('プロジェクト遅延');
    expect(result.keywords![0].frequency).toBe(1);
    expect(result.keywords![0].rank).toBe(1);
  });

  test('should handle boundary case: impact score equals 0 from TextAnalysisServiceAdapter', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'マイナーバグ', frequency: 1, keywordId: 'kw-002' },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(0), // Boundary: minimum valid
      classifyIssueSeverity: jest.fn().mockResolvedValue('low'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-007',
      startDate: new Date('2024-02-05T00:00:00Z'),
      endDate: new Date('2024-02-11T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-007',
    };

    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);

    expect(result.analysisStatus).toBe('success');
    expect(result.keywords).toBeDefined();
  });

  test('should handle boundary case: impact score equals 100 from TextAnalysisServiceAdapter', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: '重大障害', frequency: 1, keywordId: 'kw-003' },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(100), // Boundary: maximum valid
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-008',
      startDate: new Date('2024-02-12T00:00:00Z'),
      endDate: new Date('2024-02-18T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-008',
    };

    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);

    expect(result.analysisStatus).toBe('success');
    expect(result.keywords).toBeDefined();
  });

  test('should mark submission as requiring manual retry when analysis fails due to invalid impact score', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'テスト失敗', frequency: 1 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(200), // Out of range: > 100
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-009',
      startDate: new Date('2024-02-19T00:00:00Z'),
      endDate: new Date('2024-02-25T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-009',
    };

    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);

    expect(result.analysisStatus).toBe('failed');
    expect(result.submissionStatus).toBe('retry_required');
    expect(result.fallbackMessage).toMatch(/利用できません/);
  });
});