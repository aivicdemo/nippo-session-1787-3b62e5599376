import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-614
  test('日報から抽出された課題キーワードが1件の場合、そのキーワードが一覧に含まれる', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'データベース接続エラー',
            frequency: 1,
            impactScore: 65,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(65),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const reportText =
      '昨日やったこと：API開発、今日やること：テスト実施、抱えている課題：データベース接続エラーが発生している';

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
      reportTexts: [reportText],
      textAnalysisServiceAdapter: mockTextAnalysisServiceAdapter,
    };

    const result = extractAndRankIssueKeywords(input);

    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0].keyword).toBe('データベース接続エラー');
    expect(result.keywords[0].frequency).toBe(1);
    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[0].keywordId).toBeDefined();
    expect(result.totalKeywordCount).toBe(1);
    expect(result.extractedAt).toBeDefined();
    expect(result.analysisPeriodDays).toBe(1);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
  });
});