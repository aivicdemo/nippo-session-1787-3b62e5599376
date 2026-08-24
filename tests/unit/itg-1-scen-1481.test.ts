import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-1481
  test('同一キーワードが複数日報に出現した場合、累積出現頻度でランク付けされる', async () => {
    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn(),
    };

    const report1 = {
      reportId: 'report-001',
      teamId: 'team-001',
      reportedAt: new Date('2024-01-15T09:00:00Z'),
      challengeContent: 'データベース接続エラーが発生。キャッシュ層の不具合も報告。',
    };

    const report2 = {
      reportId: 'report-002',
      teamId: 'team-001',
      reportedAt: new Date('2024-01-15T09:30:00Z'),
      challengeContent: 'ネットワークエラーにより朝会参加できず。キャッシュ層の調査中。',
    };

    const report3 = {
      reportId: 'report-003',
      teamId: 'team-001',
      reportedAt: new Date('2024-01-16T09:00:00Z'),
      challengeContent: 'エラーログ分析完了。データベース接続再開。',
    };

    textAnalysisServiceAdapterStub.extractKeywords
      .mockResolvedValueOnce([
        { keyword: 'エラー', frequency: 2 },
        { keyword: 'キャッシュ', frequency: 1 },
      ])
      .mockResolvedValueOnce([
        { keyword: 'エラー', frequency: 1 },
        { keyword: 'キャッシュ', frequency: 1 },
      ])
      .mockResolvedValueOnce([
        { keyword: 'エラー', frequency: 1 },
      ]);

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-16T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
      reports: [report1, report2, report3],
      textAnalysisServiceAdapter: textAnalysisServiceAdapterStub,
    };

    const result = await extractAndRankIssueKeywords(input);

    expect(result.keywords).toHaveLength(2);
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'エラー',
      frequency: 4,
      rank: 1,
    });
    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: 'キャッシュ',
      frequency: 2,
      rank: 2,
    });
    expect(result.totalKeywordCount).toBe(2);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(2);
  });
});