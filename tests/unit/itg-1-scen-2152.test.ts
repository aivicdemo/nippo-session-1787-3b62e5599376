import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・ランク付け機能', () => {
  // SCEN-2152: [normal] 課題キーワード抽出・集約機能 - 外部サービス TextAnalysisServiceAdapter が正常応答した場合、日報テキストから課題キーワードが正確に抽出される
  test('外部サービスが正常応答した場合、日報テキストから課題キーワードが発生頻度でランク付けされて返却される', async () => {
    // TextAnalysisServiceAdapter のスタブ実装
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: '顧客A', frequency: 4 },
        { keyword: 'バグ修正', frequency: 1 },
        { keyword: '新機能開発', frequency: 1 },
        { keyword: '仕様不明確', frequency: 1 },
        { keyword: '納期迫近', frequency: 1 },
        { keyword: '顧客B', frequency: 1 }
      ])
    };

    const reportText = '昨日は顧客Aのバグ修正を行った。今日は顧客Aの新機能開発を予定。課題として、顧客Aの仕様が不明確で、顧客Aの納期が迫っている。また顧客Bからのリクエストも停滞中';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-manager-001';

    const input = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
      reportText
    };

    // 対象関数を呼び出す
    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);

    // 外部サービスが正常応答した場合の検証
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(reportText);
    
    // 抽出されたキーワードが発生頻度の高い順にランク付けされていることを確認
    expect(result.keywords).toHaveLength(6);
    
    // ランク 1：顧客A（出現頻度4回）
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: '顧客A',
      frequency: 4,
      rank: 1
    });
    
    // ランク 2：納期迫近（出現頻度1回）- 複数の頻度1のキーワード内での順序
    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: 'バグ修正',
      frequency: 1,
      rank: 2
    });
    
    // ランク 3：仕様不明確
    expect(result.keywords[2]).toEqual({
      keywordId: expect.any(String),
      keyword: '新機能開発',
      frequency: 1,
      rank: 3
    });
    
    // ランク 4
    expect(result.keywords[3]).toEqual({
      keywordId: expect.any(String),
      keyword: '仕様不明確',
      frequency: 1,
      rank: 4
    });
    
    // ランク 5
    expect(result.keywords[4]).toEqual({
      keywordId: expect.any(String),
      keyword: '納期迫近',
      frequency: 1,
      rank: 5
    });
    
    // ランク 6
    expect(result.keywords[5]).toEqual({
      keywordId: expect.any(String),
      keyword: '顧客B',
      frequency: 1,
      rank: 6
    });

    // 抽出されたキーワードの総数が正しいことを確認
    expect(result.totalKeywordCount).toBe(6);

    // 抽出処理の実行日時が ISO 8601 形式で記録されていることを確認
    expect(result.extractedAt).toBeInstanceOf(Date);
    
    // 分析対象期間が7日（1月8日～1月14日）であることを確認
    const expectedAnalysisPeriodDays = 7;
    expect(result.analysisperiodDays).toBe(expectedAnalysisPeriodDays);
  });
});