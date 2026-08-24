import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-1707
  test('should extract and rank issue keywords from single weekly report with correct frequency', async () => {
    const targetTeamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const requestUserId = 'user-dept-head-001';

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'database_connection_error',
            frequency: 1,
            confidence: 0.95
          },
          {
            keyword: 'api_response_delay',
            frequency: 1,
            confidence: 0.92
          }
        ]
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: '',
        impactScore: 50
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium')
    };

    const mockReportingRepository = {
      findByTeamAndDateRange: jest.fn().mockResolvedValue([
        {
          reportId: 'report-001',
          teamId: targetTeamId,
          reportingDate: new Date('2024-01-12T09:00:00Z'),
          challengeContent: 'We experienced database_connection_error and api_response_delay during deployment.',
          createdAt: new Date('2024-01-12T09:00:00Z'),
          submittedAt: new Date('2024-01-12T09:15:00Z')
        }
      ])
    };

    const mockKeywordRepository = {
      saveExtractedKeywords: jest.fn().mockResolvedValue({
        success: true,
        savedCount: 2
      })
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: targetTeamId,
      startDate: startDate,
      endDate: endDate,
      minFrequencyThreshold: 1,
      requestUserId: requestUserId
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
      mockReportingRepository,
      mockKeywordRepository
    );

    expect(result.keywords).toHaveLength(2);
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'database_connection_error',
      frequency: 1,
      rank: 1
    });
    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: 'api_response_delay',
      frequency: 1,
      rank: 2
    });
    expect(result.totalKeywordCount).toBe(2);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);

    expect(mockReportingRepository.findByTeamAndDateRange).toHaveBeenCalledWith(
      targetTeamId,
      startDate,
      endDate
    );
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockKeywordRepository.saveExtractedKeywords).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          keyword: 'database_connection_error',
          frequency: 1
        }),
        expect.objectContaining({
          keyword: 'api_response_delay',
          frequency: 1
        })
      ])
    );
  });
});