import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-1190
  test('should handle null confidenceThreshold in assessImpactScore gracefully', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: '納期遅延', frequency: 3 },
          { keyword: '波及', frequency: 2 }
        ],
        confidence: 0.85
      }),
      assessImpactScore: jest.fn().mockRejectedValue(
        new TypeError('confidenceThreshold is required')
      ),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high'
      })
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    const reportingTexts = [
      'プロジェクトAで納期遅延が発生。チーム全体に波及',
      '納期遅延による顧客対応が波及',
      '納期遅延の根本原因を調査中'
    ];

    try {
      const result = await extractAndRankIssueKeywords(
        input,
        mockTextAnalysisAdapter as any,
        reportingTexts
      );

      expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledWith(
        expect.any(Array),
        null
      );
      fail('Expected error to be thrown when confidenceThreshold is null');
    } catch (error) {
      expect(error).toBeInstanceOf(TypeError);
      expect((error as Error).message).toMatch(/confidenceThreshold/);
    }

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
  });
});