import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  test('SCEN-2788: 複数日報から集計したキーワード出現頻度が業務上最大規模（1000件以上）でも正確に計算される', () => {
    // モック化したTextAnalysisServiceAdapter
    const mockTextAnalysisService = {
      extractKeywords: jest.fn((reportText: string) => {
        // 日報テキストから課題キーワードを抽出（重複をシミュレート）
        const keywords: Array<{ keyword: string; frequency: number }> = [];
        
        if (reportText.includes('API遅延')) {
          keywords.push({ keyword: 'API遅延', frequency: 1 });
        }
        if (reportText.includes('DB接続エラー')) {
          keywords.push({ keyword: 'DB接続エラー', frequency: 1 });
        }
        if (reportText.includes('メモリリーク')) {
          keywords.push({ keyword: 'メモリリーク', frequency: 1 });
        }
        if (reportText.includes('パフォーマンス低下')) {
          keywords.push({ keyword: 'パフォーマンス低下', frequency: 1 });
        }
        if (reportText.includes('ネットワークタイムアウト')) {
          keywords.push({ keyword: 'ネットワークタイムアウト', frequency: 1 });
        }
        
        return keywords;
      }),
    };

    // 1000件以上の日報データセットを生成
    const reportCount = 1050;
    const reports: Array<{ reportId: string; reportText: string; reportDate: Date }> = [];
    
    // 課題キーワードの分布をシミュレート
    // 全1050件の日報に対して、キーワードの出現パターンを設定
    for (let i = 0; i < reportCount; i++) {
      let reportText = '';
      
      // API遅延: 600件に出現
      if (i < 600) {
        reportText += 'API遅延 ';
      }
      
      // DB接続エラー: 450件に出現
      if (i < 450) {
        reportText += 'DB接続エラー ';
      }
      
      // メモリリーク: 350件に出現
      if (i < 350) {
        reportText += 'メモリリーク ';
      }
      
      // パフォーマンス低下: 280件に出現
      if (i < 280) {
        reportText += 'パフォーマンス低下 ';
      }
      
      // ネットワークタイムアウト: 220件に出現
      if (i < 220) {
        reportText += 'ネットワークタイムアウト ';
      }
      
      reports.push({
        reportId: `report-${i}`,
        reportText: reportText.trim(),
        reportDate: new Date('2024-01-15T09:00:00Z'),
      });
    }

    // 期待される出現回数を手動計算
    const expectedFrequencies: { [key: string]: number } = {
      'API遅延': 600,
      'DB接続エラー': 450,
      'メモリリーク': 350,
      'パフォーマンス低下': 280,
      'ネットワークタイムアウト': 220,
    };

    const expectedTotalKeywordCount = Object.values(expectedFrequencies).reduce((sum, freq) => sum + freq, 0);
    // 総キーワード出現数: 600 + 450 + 350 + 280 + 220 = 1900

    // 処理開始時刻を記録
    const startTime = performance.now();

    // 関数を呼び出し
    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const result = extractAndRankIssueKeywords(input, {
      extractReportsByTeamDateRange: jest.fn(() => reports),
      analyzeReportTexts: jest.fn((reportTexts: string[]) => {
        // 全テキストをまとめて解析
        const aggregatedKeywords: { [key: string]: number } = {};
        
        reportTexts.forEach((text) => {
          mockTextAnalysisService.extractKeywords(text).forEach((item) => {
            aggregatedKeywords[item.keyword] = (aggregatedKeywords[item.keyword] || 0) + item.frequency;
          });
        });
        
        return Object.entries(aggregatedKeywords).map(([keyword, frequency]) => ({
          keyword,
          frequency,
        }));
      }),
    });

    // 処理終了時刻を記録
    const endTime = performance.now();
    const processingTimeMs = endTime - startTime;

    // Assertion 1: 結果が正しく返されていることを確認
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    // Assertion 2: 合計出現キーワード数が期待値と一致することを確認
    expect(result.totalKeywordCount).toBe(expectedTotalKeywordCount);

    // Assertion 3: 各キーワードの出現回数が期待値と一致することを確認
    result.keywords.forEach((rankedKeyword) => {
      expect(expectedFrequencies[rankedKeyword.keyword]).toBeDefined();
      expect(rankedKeyword.frequency).toBe(expectedFrequencies[rankedKeyword.keyword]);
    });

    // Assertion 4: ランク付けが出現頻度の降順であることを確認
    for (let i = 0; i < result.keywords.length - 1; i++) {
      expect(result.keywords[i].frequency).toBeGreaterThanOrEqual(result.keywords[i + 1].frequency);
    }

    // Assertion 5: ランク番号が1から始まり、連続していることを確認
    result.keywords.forEach((rankedKeyword, index) => {
      expect(rankedKeyword.rank).toBe(index + 1);
    });

    // Assertion 6: 上位5位のキーワードが期待値と一致することを確認
    const top5Expected = [
      { keyword: 'API遅延', frequency: 600, rank: 1 },
      { keyword: 'DB接続エラー', frequency: 450, rank: 2 },
      { keyword: 'メモリリーク', frequency: 350, rank: 3 },
      { keyword: 'パフォーマンス低下', frequency: 280, rank: 4 },
      { keyword: 'ネットワークタイムアウト', frequency: 220, rank: 5 },
    ];

    top5Expected.forEach((expected, index) => {
      expect(result.keywords[index].keyword).toBe(expected.keyword);
      expect(result.keywords[index].frequency).toBe(expected.frequency);
      expect(result.keywords[index].rank).toBe(expected.rank);
    });

    // Assertion 7: 分析期間の日数が正確に計算されていることを確認
    const expectedAnalysisPeriodDays = 1;
    expect(result.analysisperiodDays).toBe(expectedAnalysisPeriodDays);

    // Assertion 8: 抽出実行日時が記録されていることを確認
    expect(result.extractedAt).toBeDefined();
    expect(result.extractedAt instanceof Date).toBe(true);

    // Assertion 9: 処理所要時間が業務許容値（5秒以内）を超えていないことを確認
    expect(processingTimeMs).toBeLessThan(5000);

    // Assertion 10: メモリ使用量が異常でないことを確認（Node.js のメモリ使用量チェック）
    if (global.gc) {
      global.gc();
    }
    const memUsage = process.memoryUsage();
    // ヒープ使用量が500MB以下であることを確認（大規模データセットでもメモリリークなし）
    expect(memUsage.heapUsed).toBeLessThan(500 * 1024 * 1024);
  });
});