import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Cross-Month Period Aggregation', () => {
  // SCEN-886
  test('should correctly aggregate keyword frequencies across month boundaries when analysis period spans from month start to end', async () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-01-31T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001'
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(async (reportText: string) => {
        const keywordMap: { [key: string]: number } = {};
        
        if (reportText.includes('データベース接続エラーが発生')) {
          keywordMap['DB接続'] = 3;
        }
        if (reportText.includes('DB接続の問題が続く')) {
          keywordMap['DB接続'] = 2;
        }
        if (reportText.includes('DB接続エラー対応完了、新しい問題発見')) {
          keywordMap['DB接続'] = 1;
          keywordMap['新しい問題'] = 2;
        }
        if (reportText.includes('新しい問題について調査中')) {
          keywordMap['新しい問題'] = 3;
        }
        
        return keywordMap;
      })
    };

    const mockReportingRepository = {
      getReportsByTeamAndDateRange: jest.fn(async () => [
        {
          reportId: 'report-001',
          teamId: 'team-001',
          reportDate: new Date('2026-01-05T09:00:00Z'),
          challengeDescription: 'データベース接続エラーが発生'
        },
        {
          reportId: 'report-002',
          teamId: 'team-001',
          reportDate: new Date('2026-01-10T09:00:00Z'),
          challengeDescription: 'DB接続の問題が続く'
        },
        {
          reportId: 'report-003',
          teamId: 'team-001',
          reportDate: new Date('2026-01-20T09:00:00Z'),
          challengeDescription: 'DB接続エラー対応完了、新しい問題発見'
        },
        {
          reportId: 'report-004',
          teamId: 'team-001',
          reportDate: new Date('2026-01-28T09:00:00Z'),
          challengeDescription: '新しい問題について調査中'
        }
      ])
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
      mockReportingRepository
    );

    expect(result.keywords).toHaveLength(2);
    
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'DB接続',
      frequency: 6,
      rank: 1
    });
    
    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: '新しい問題',
      frequency: 5,
      rank: 2
    });

    expect(result.totalKeywordCount).toBe(2);
    expect(result.analysisperiodDays).toBe(31);
    expect(result.extractedAt).toEqual(expect.any(Date));
  });
});