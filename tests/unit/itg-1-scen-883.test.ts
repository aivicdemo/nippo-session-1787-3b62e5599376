import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords - 同一キーワード複数日重複出現時の累計頻度合算', () => {
  test('SCEN-883: 複数日の日報に同一キーワードが出現したとき、累計頻度として正しく合算される', () => {
    // Setup: 複数日の報告データを準備
    const teamId = 'team-001';
    const startDate = new Date('2026-01-10T00:00:00Z');
    const endDate = new Date('2026-01-11T23:59:59Z');
    const requestUserId = 'user-pm-001';
    const minFrequencyThreshold = 1;

    // Mock TextAnalysisServiceAdapter
    // 1日目（2026-01-10）: データベース接続エラー、ネットワーク遅延 各1件
    // 2日目（2026-01-11）: データベース接続エラー、ネットワーク遅延 各1件
    const mockExtractedKeywordsDay1 = [
      { keyword: 'データベース接続エラー', frequency: 1 },
      { keyword: 'ネットワーク遅延', frequency: 1 }
    ];

    const mockExtractedKeywordsDay2 = [
      { keyword: 'データベース接続エラー', frequency: 1 },
      { keyword: 'ネットワーク遅延', frequency: 1 }
    ];

    // Mock adapter
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest
        .fn()
        .mockReturnValueOnce(mockExtractedKeywordsDay1)
        .mockReturnValueOnce(mockExtractedKeywordsDay2),
      assessImpactScore: jest.fn().mockReturnValue(50),
      classifyIssueSeverity: jest.fn().mockReturnValue('medium')
    };

    // Mock report data from multiple days
    const mockReportData = [
      {
        reportId: 'report-001',
        teamId: teamId,
        reportDate: new Date('2026-01-10T09:00:00Z'),
        issueContent: 'データベース接続エラーが発生。ネットワーク遅延が原因と推測'
      },
      {
        reportId: 'report-002',
        teamId: teamId,
        reportDate: new Date('2026-01-11T09:00:00Z'),
        issueContent: '昨日に引き続きデータベース接続エラーが再発。ネットワーク遅延の改善なし'
      }
    ];

    // Execute: extractAndRankIssueKeywords を呼び出す
    const input: ExtractIssueKeywordsInput = {
      teamId: teamId,
      startDate: startDate,
      endDate: endDate,
      minFrequencyThreshold: minFrequencyThreshold,
      requestUserId: requestUserId
    };

    // Note: 実装では TextAnalysisServiceAdapter が内部で使用される想定
    // ここではモック化された状態での結果を検証
    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
      mockReportData
    );

    // Verify: 累計頻度が正しく合算されていることを確認
    // 期待値: 「データベース接続エラー」の累計頻度 = 2（1日目+2日目）
    //        「ネットワーク遅延」の累計頻度 = 2（1日目+2日目）
    expect(result.keywords).toHaveLength(2);

    // Check for "データベース接続エラー"
    const dbErrorKeyword = result.keywords.find(
      (kw) => kw.keyword === 'データベース接続エラー'
    );
    expect(dbErrorKeyword).toBeDefined();
    expect(dbErrorKeyword?.frequency).toBe(2);
    expect(dbErrorKeyword?.rank).toBe(1);

    // Check for "ネットワーク遅延"
    const networkDelayKeyword = result.keywords.find(
      (kw) => kw.keyword === 'ネットワーク遅延'
    );
    expect(networkDelayKeyword).toBeDefined();
    expect(networkDelayKeyword?.frequency).toBe(2);
    expect(networkDelayKeyword?.rank).toBe(1);

    // Verify: totalKeywordCount は フィルタ前の全キーワード数（重複なし）
    expect(result.totalKeywordCount).toBe(2);

    // Verify: extractedAt は処理実行日時が記録されている
    expect(result.extractedAt).toBeInstanceOf(Date);

    // Verify: analysisPeriodDays は 2日間（2026-01-10〜2026-01-11）
    expect(result.analysisperiodDays).toBe(2);

    // Verify: keywords配列が頻度の降順でランク付けされている
    // 両キーワードの頻度が同じ場合は登録順（昇順）でソート
    expect(result.keywords[0].frequency).toBeGreaterThanOrEqual(
      result.keywords[1]?.frequency ?? 0
    );
  });
});