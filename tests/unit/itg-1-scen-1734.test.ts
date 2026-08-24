import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度スコア算出機能', () => {
  test('SCEN-1734: 影響度スコアが範囲外（0未満）のとき優先度スコア算出がエラーになる', async () => {
    // Arrange
    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['システム障害'],
        frequency: 1,
      }),
      assessImpactScore: jest.fn().mockResolvedValue(-5),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const challengeText = 'システム障害が発生した';

    // Act & Assert
    try {
      await extractAndRankIssueKeywords(
        input,
        textAnalysisServiceAdapterStub
      );
      fail('Expected error to be thrown');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error instanceof Error).toBe(true);
      if (error instanceof Error) {
        expect(error.message).toMatch(/影響度スコア/);
        expect(error.message).toMatch(/0-100/);
        expect(error.message).toMatch(/-5/);
      }
    }

    // Assert that assessImpactScore was called with the extracted keyword
    expect(textAnalysisServiceAdapterStub.assessImpactScore).toHaveBeenCalled();

    // Verify stub was configured correctly
    expect(textAnalysisServiceAdapterStub.extractKeywords).toHaveBeenCalled();
  });
});