import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type TextAnalysisServiceAdapter } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向分析 - 重複レコード除外処理', () => {
  // SCEN-1703
  test('重複を含む課題キーワード配列が分析対象の場合、重複を除外して集計し、出現頻度を合算する', async () => {
    const mockTextAnalysisServiceAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: '納期遅延', frequency: 3 },
        { keyword: '納期遅延', frequency: 2 },
        { keyword: 'リソース不足', frequency: 1 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input = {
      weekStartDate: new Date('2024-01-15T00:00:00Z'),
      weekEndDate: new Date('2024-01-21T23:59:59Z'),
      teamIds: ['team-001'],
      requestedByUserId: 'user-admin-001',
    };

    const result = await extractWeeklyReportData(
      input,
      mockTextAnalysisServiceAdapter
    );

    expect(result.extractedChallenges).toHaveLength(2);

    const mergedChallenge = result.extractedChallenges.find(
      (c) => c.keyword === '納期遅延'
    );
    expect(mergedChallenge).toBeDefined();
    expect(mergedChallenge?.totalFrequency).toBe(5);
    expect(mergedChallenge?.uniqueCount).toBe(1);

    const otherChallenge = result.extractedChallenges.find(
      (c) => c.keyword === 'リソース不足'
    );
    expect(otherChallenge).toBeDefined();
    expect(otherChallenge?.totalFrequency).toBe(1);
    expect(otherChallenge?.uniqueCount).toBe(1);

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
  });
});