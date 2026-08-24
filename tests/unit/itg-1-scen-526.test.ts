import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  // SCEN-526: [normal] 課題自動抽出・優先度判定機能 - 同じ日報セットで2回実行しても、同じ優先度別課題一覧が生成される
  test('should return identical ranked issue keyword list when executed twice with the same report set', async () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-31T23:59:59Z');
    const requestUserId = 'user-001';
    const minFrequencyThreshold = 1;

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: '遅延', frequency: 3 },
          { keyword: 'バグ', frequency: 2 }
        ]
      }),
      assessImpactScore: jest.fn().mockResolvedValue({ impactScore: 75 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: '高' })
    };

    const mockReportRepository = {
      findByTeamAndDateRange: jest.fn().mockResolvedValue([
        {
          reportId: 'report-001',
          teamId: teamId,
          content: 'システム遅延が続いている',
          reportedDate: new Date('2024-01-15T09:00:00Z')
        },
        {
          reportId: 'report-002',
          teamId: teamId,
          content: 'バグが多く発見されている',
          reportedDate: new Date('2024-01-15T09:30:00Z')
        },
        {
          reportId: 'report-003',
          teamId: teamId,
          content: '遅延とバグの同時対応が困難',
          reportedDate: new Date('2024-01-15T10:00:00Z')
        }
      ])
    };

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId
    };

    // First execution
    const resultA = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
      mockReportRepository
    );

    // Second execution with same input
    const resultB = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
      mockReportRepository
    );

    // Verify both results have the same structure and values
    expect(resultA).toEqual(resultB);

    // Verify specific expected values
    expect(resultA.keywords).toHaveLength(2);
    expect(resultA.totalKeywordCount).toBe(2);

    // Verify first ranked keyword (highest frequency)
    expect(resultA.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: '遅延',
      frequency: 3,
      rank: 1
    });

    // Verify second ranked keyword
    expect(resultA.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: 'バグ',
      frequency: 2,
      rank: 2
    });

    // Verify metadata
    expect(resultA.extractedAt).toBeInstanceOf(Date);
    expect(resultA.analysisperiodDays).toBe(31);

    // Verify that both executions produced identical keyword order and attributes
    expect(resultB.keywords[0].keyword).toBe(resultA.keywords[0].keyword);
    expect(resultB.keywords[0].frequency).toBe(resultA.keywords[0].frequency);
    expect(resultB.keywords[0].rank).toBe(resultA.keywords[0].rank);

    expect(resultB.keywords[1].keyword).toBe(resultA.keywords[1].keyword);
    expect(resultB.keywords[1].frequency).toBe(resultA.keywords[1].frequency);
    expect(resultB.keywords[1].rank).toBe(resultA.keywords[1].rank);

    // Verify complete JSON structure equivalence
    expect(JSON.stringify(resultA)).toBe(JSON.stringify(resultB));
  });
});