import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題自動抽出・優先度判定機能 - チーム波及度スコア判定', () => {
  // SCEN-460: [edge] 課題自動抽出・優先度判定機能 - チーム波及度スコアが0（波及なし）と判定された課題は優先度ランクの最下位に配置される
  test('チーム波及度スコア0の課題は優先度ランク最下位に配置される', async () => {
    const mockAssessImpactScore = jest.fn().mockImplementation((keyword: string) => {
      if (keyword === 'ネットワーク障害') return 85;
      if (keyword === 'データベース接続エラー') return 72;
      if (keyword === '軽微なUIバグ') return 0;
      return 50;
    });

    const mockExtractKeywords = jest.fn().mockResolvedValue([
      { keyword: 'ネットワーク障害', frequency: 3 },
      { keyword: 'データベース接続エラー', frequency: 2 },
      { keyword: '軽微なUIバグ', frequency: 1 }
    ]);

    const textAnalysisServiceAdapter = {
      extractKeywords: mockExtractKeywords,
      assessImpactScore: mockAssessImpactScore,
      classifyIssueSeverity: jest.fn()
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(input, textAnalysisServiceAdapter);

    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBe(3);

    const zeroImpactKeyword = result.keywords.find(k => k.keyword === '軽微なUIバグ');
    const highImpactKeywords = result.keywords.filter(k => k.keyword !== '軽微なUIバグ');

    expect(zeroImpactKeyword).toBeDefined();
    expect(zeroImpactKeyword!.rank).toBe(3);

    highImpactKeywords.forEach(kw => {
      expect(kw.rank).toBeLessThan(zeroImpactKeyword!.rank);
    });

    const rankedByFrequency = result.keywords.sort((a, b) => b.frequency - a.frequency);
    expect(rankedByFrequency[0].keyword).toBe('ネットワーク障害');
    expect(rankedByFrequency[1].keyword).toBe('データベース接続エラー');
    expect(rankedByFrequency[2].keyword).toBe('軽微なUIバグ');

    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);
  });
});