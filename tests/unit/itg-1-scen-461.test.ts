import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-461: [edge] 課題自動抽出・優先度判定機能 - チーム波及度スコアがちょうど100（最大波及）と判定された課題は優先度ランクの最上位に配置される
  test('チーム波及度スコア100と判定された課題が優先度ランク1番目に配置される', async () => {
    // Arrange
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'ネットワーク障害', frequency: 3 },
        { keyword: 'データベース遅延', frequency: 2 },
        { keyword: 'UI不具合', frequency: 1 },
      ]),
      assessImpactScore: jest.fn((keyword: string): number => {
        if (keyword === 'ネットワーク障害') {
          return 100;
        }
        if (keyword === 'データベース遅延') {
          return 75;
        }
        if (keyword === 'UI不具合') {
          return 50;
        }
        return 0;
      }),
      classifyIssueSeverity: jest.fn((keyword: string): string => {
        if (keyword === 'ネットワーク障害') {
          return '高';
        }
        if (keyword === 'データベース遅延') {
          return '中';
        }
        return '低';
      }),
    };

    const reportTexts = [
      'ネットワーク障害が発生しました。全システムに波及しています。',
      'データベース遅延が見られます。一部機能に影響があります。',
      'UI不具合が報告されました。限定的な影響です。',
    ];

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Act
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
      reportTexts
    );

    // Assert
    expect(result.keywords).toBeDefined();
    expect(result.keywords.length).toBeGreaterThan(0);

    // チーム波及度スコア100の課題がランク1番目に配置されていること
    const topRankedKeyword = result.keywords[0];
    expect(topRankedKeyword.keyword).toBe('ネットワーク障害');
    expect(topRankedKeyword.rank).toBe(1);
    expect(topRankedKeyword.frequency).toBe(3);

    // 全課題がスコア順に正しくランク付けされていること
    if (result.keywords.length >= 2) {
      const secondKeyword = result.keywords[1];
      expect(secondKeyword.keyword).toBe('データベース遅延');
      expect(secondKeyword.rank).toBe(2);
    }

    if (result.keywords.length >= 3) {
      const thirdKeyword = result.keywords[2];
      expect(thirdKeyword.keyword).toBe('UI不具合');
      expect(thirdKeyword.rank).toBe(3);
    }

    // メタデータの検証
    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toBeDefined();
    expect(result.analysisperiodDays).toBe(7);
  });
});