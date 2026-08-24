import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出機能', () => {
  // SCEN-1336
  test('課題キーワード発生頻度がちょうど閾値（5回）で該当ランクに分類される', () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          {
            keyword: 'システム障害',
            frequency: 5,
          },
        ],
        totalCount: 5,
      }),
      assessImpactScore: jest.fn().mockReturnValue(65),
      classifyIssueSeverity: jest.fn().mockReturnValue('medium'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-21T23:59:59Z'),
      minFrequencyThreshold: 5,
      requestUserId: 'user-123',
    };

    const reportTexts = [
      'システム障害が発生した。',
      'システム障害の対応を行った。',
      'システム障害の原因を調査した。',
      'システム障害の報告書を作成した。',
      'システム障害の再発防止策を立案した。',
    ];

    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisService,
      reportTexts,
    );

    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0].keyword).toBe('システム障害');
    expect(result.keywords[0].frequency).toBe(5);
    expect(result.keywords[0].rank).toBe(1);
    expect(result.totalKeywordCount).toBe(1);
    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalledWith(
      expect.stringContaining('システム障害'),
    );
    expect(mockTextAnalysisService.classifyIssueSeverity).toHaveBeenCalled();
  });
});