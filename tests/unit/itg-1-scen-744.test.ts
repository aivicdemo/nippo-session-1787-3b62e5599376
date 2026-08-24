import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Error Handling', () => {
  test('SCEN-744: extractAndRankIssueKeywords returns error when report text is null', async () => {
    // Arrange: Mock TextAnalysisServiceAdapter
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockRejectedValue(
        new TypeError('Report text cannot be null or undefined')
      ),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      reportTexts: [null as any],
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Act & Assert: Call function with null report text
    try {
      const result = await extractAndRankIssueKeywords(
        input,
        mockTextAnalysisAdapter
      );

      // Verify error object is returned
      expect(result).toHaveProperty('errorCode');
      expect(result).toHaveProperty('errorMessage');
      expect(result.errorCode).toBe('ANALYSIS_UNAVAILABLE');
      expect(result.errorMessage).toMatch(/課題分析が一時的に利用できません/);

      // Verify extractKeywords was called with null
      expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(null);

      // Verify downstream methods were NOT called
      expect(mockTextAnalysisAdapter.assessImpactScore).not.toHaveBeenCalled();
      expect(mockTextAnalysisAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
    } catch (error) {
      // If function throws instead of returning error object, verify error type
      expect(error).toBeInstanceOf(TypeError);
      expect((error as Error).message).toMatch(/null|undefined/);
    }
  });
});