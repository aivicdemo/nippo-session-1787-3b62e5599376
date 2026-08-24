import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - extractAndRankIssueKeywords', () => {
  // SCEN-3069: [normal] OpenAI API GPT-5.6連携 - TextAnalysisServiceAdapter.extractKeywordsが正常応答を受けた場合、日報から課題キーワードが抽出され出現頻度が記録される

  let mockIssueKeywordRepository: any;
  let mockTextAnalysisServiceAdapter: any;

  beforeEach(() => {
    mockIssueKeywordRepository = {
      findByKeyword: jest.fn(),
      upsertKeyword: jest.fn().mockResolvedValue(undefined),
      getAllByTeamAndDateRange: jest.fn().mockResolvedValue([]),
    };

    mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { term: '顧客システム障害', frequency: 3 },
          { term: 'DB接続タイムアウト', frequency: 2 },
          { term: 'ログ出力', frequency: 1 },
        ],
        analysisTimestamp: '2026-08-19T10:30:00Z',
        confidence: 0.92,
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should extract and rank issue keywords from daily report with correct frequency and metadata', async () => {
    const reporterUserId = 'user-001';
    const teamId = 'team-engineering';
    const startDate = new Date('2026-08-19T00:00:00Z');
    const endDate = new Date('2026-08-19T23:59:59Z');
    const minFrequencyThreshold = 1;

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId: reporterUserId,
    };

    const reportText =
      '顧客システムの障害対応を行った。顧客システムの復旧確認後、DB接続タイムアウトの問題が発生。今日は顧客システムの詳細調査とログ出力の確認を行う予定。';

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
      mockIssueKeywordRepository,
      reportText
    );

    expect(result).toBeDefined();
    expect(result.keywords).toHaveLength(3);

    const firstKeyword = result.keywords[0];
    expect(firstKeyword.keyword).toBe('顧客システム障害');
    expect(firstKeyword.frequency).toBe(3);
    expect(firstKeyword.rank).toBe(1);
    expect(firstKeyword.keywordId).toBeDefined();

    const secondKeyword = result.keywords[1];
    expect(secondKeyword.keyword).toBe('DB接続タイムアウト');
    expect(secondKeyword.frequency).toBe(2);
    expect(secondKeyword.rank).toBe(2);

    const thirdKeyword = result.keywords[2];
    expect(thirdKeyword.keyword).toBe('ログ出力');
    expect(thirdKeyword.frequency).toBe(1);
    expect(thirdKeyword.rank).toBe(3);

    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toBe('2026-08-19T10:30:00Z');

    const expectedAnalysisPeriodDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    expect(result.analysisperiodDays).toBe(expectedAnalysisPeriodDays);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(reportText);
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(1);

    expect(mockIssueKeywordRepository.upsertKeyword).toHaveBeenCalledTimes(3);

    expect(mockIssueKeywordRepository.upsertKeyword).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: '顧客システム障害',
        frequency: 3,
        teamId,
        lastDetected: '2026-08-19T10:30:00Z',
        confidence: 0.92,
      })
    );

    expect(mockIssueKeywordRepository.upsertKeyword).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: 'DB接続タイムアウト',
        frequency: 2,
        teamId,
        lastDetected: '2026-08-19T10:30:00Z',
        confidence: 0.92,
      })
    );

    expect(mockIssueKeywordRepository.upsertKeyword).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: 'ログ出力',
        frequency: 1,
        teamId,
        lastDetected: '2026-08-19T10:30:00Z',
        confidence: 0.92,
      })
    );
  });
});