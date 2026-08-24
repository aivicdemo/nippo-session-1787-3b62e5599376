import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  test('SCEN-2786: Extract and rank keywords with edge case frequency threshold exactly at minimum', () => {
    // Arrange
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 4;
    const requestUserId = 'user-001';

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue(
        new Map([
          ['システム障害', 4],
          ['ネットワーク遅延', 3],
          ['データベース接続エラー', 2],
          ['API応答遅延', 1],
        ])
      ),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const reportTexts = [
      'システム障害が発生しました。システム障害により対応が遅れました。',
      'システム障害の原因を調査中です。システム障害は継続中です。',
      'ネットワーク遅延が発生しましたが、データベース接続エラーは解決しました。',
      'API応答遅延が検出されました。',
    ];

    // Act
    const result = extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold,
        requestUserId,
      },
      mockTextAnalysisAdapter
    );

    // Assert - Verify the result structure
    expect(result).toHaveProperty('keywords');
    expect(result).toHaveProperty('totalKeywordCount');
    expect(result).toHaveProperty('extractedAt');
    expect(result).toHaveProperty('analysisperiodDays');

    // Assert - Verify keywords array contains only entries >= minFrequencyThreshold
    expect(result.keywords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keyword: 'システム障害',
          frequency: 4,
          rank: 1,
        }),
      ])
    );

    // Assert - Verify keywords with frequency < 4 are NOT included
    const keywordTexts = result.keywords.map((k) => k.keyword);
    expect(keywordTexts).not.toContain('ネットワーク遅延');
    expect(keywordTexts).not.toContain('データベース接続エラー');
    expect(keywordTexts).not.toContain('API応答遅延');

    // Assert - Verify total keyword count (includes all extracted keywords regardless of threshold)
    expect(result.totalKeywordCount).toBe(4);

    // Assert - Verify analysis period days
    const expectedDays = 7;
    expect(result.analysisperiodDays).toBe(expectedDays);

    // Assert - Verify extracted at is a valid date
    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});