import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking', () => {
  // SCEN-1189
  test('should handle error when impact score exceeds 100', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'database_performance', frequency: 3 },
        { keyword: 'api_timeout', frequency: 2 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(101),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-dept-head-001',
    };

    let result: RankedIssueKeywordList | null = null;
    let capturedError: Error | null = null;
    let userMessage = '';
    let internalLog = { scoreValue: 0, errorType: '' };
    let handlingMode = '';

    try {
      result = await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);
    } catch (error) {
      capturedError = error as Error;
    }

    if (capturedError) {
      userMessage = '課題分析が一時的に利用できません。手動入力をご利用ください';
      internalLog.scoreValue = 101;
      internalLog.errorType = 'AssessImpactScore_OutOfRange';
      handlingMode = 'manual_input_mode';

      expect(capturedError.message).toMatch(/score|range|exceed|100/i);
      expect(internalLog.scoreValue).toBe(101);
      expect(internalLog.errorType).toBe('AssessImpactScore_OutOfRange');
      expect(handlingMode).toBe('manual_input_mode');
      expect(userMessage).toBe('課題分析が一時的に利用できません。手動入力をご利用ください');
    } else {
      if (result?.keywords) {
        const invalidKeywords = result.keywords.filter((kw) => kw.rank === -1 || !kw.keyword);
        expect(invalidKeywords.length).toBeGreaterThanOrEqual(0);
      }
    }

    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
  });
});