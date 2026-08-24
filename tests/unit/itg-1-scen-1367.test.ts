import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import { type DailyReport } from '../../src/logic/issue-analysis';

describe('優先度の高い課題を部長向けダッシュボードで強調表示する機能', () => {
  // SCEN-1367
  test('重複課題の自動判定と統合 - 部長ダッシュボード表示用に統合済みフラグを含む課題リストが生成される', () => {
    // Arrange: TextAnalysisServiceAdapterのモック
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        if (text.includes('API連携遅延')) {
          return {
            keywords: [
              { keyword: 'API連携遅延', frequency: 1 }
            ]
          };
        } else if (text.includes('ドキュメント作成')) {
          return {
            keywords: [
              { keyword: 'ドキュメント作成', frequency: 1 }
            ]
          };
        }
        return { keywords: [] };
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        if (keyword === 'API連携遅延') {
          return { impactScore: 85 };
        } else if (keyword === 'ドキュメント作成') {
          return { impactScore: 42 };
        }
        return { impactScore: 0 };
      })
    };

    // 3件の日報データを準備
    const reportDataList: DailyReport[] = [
      {
        id: 'report_001',
        date: '2024-01-15',
        content: 'API連携遅延により進捗が遅れています。API連携遅延の影響が大きい。API連携遅延への対応が必要です。',
        issues: ['API連携遅延']
      },
      {
        id: 'report_002',
        date: '2024-01-15',
        content: 'API連携遅延の問題が引き続き発生。API連携遅延を解決する必要がある。',
        issues: ['API連携遅延']
      },
      {
        id: 'report_003',
        date: '2024-01-15',
        content: 'ドキュメント作成が進まない。ドキュメント作成の時間が足りない。',
        issues: ['ドキュメント作成']
      }
    ];

    const input = {
      reportDataList,
      analysisStartDate: '2024-01-15T00:00:00Z',
      analysisEndDate: '2024-01-15T23:59:59Z',
      minFrequencyThreshold: 1
    };

    // Act
    const result = extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    // Assert
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    // API連携遅延が統合済み（複数の日報から検出）
    const mergedApiIssue = result.keywords.find(
      (kw: any) => kw.keyword === 'API連携遅延'
    );
    expect(mergedApiIssue).toBeDefined();
    expect(mergedApiIssue.mergedFlag).toBe(true);
    expect(mergedApiIssue.sourceReports).toEqual(['report_001', 'report_002']);
    expect(mergedApiIssue.frequency).toBe(2);
    expect(mergedApiIssue.priorityScore).toBe(85);

    // ドキュメント作成は非重複（1つの日報からのみ検出）
    const singleDocIssue = result.keywords.find(
      (kw: any) => kw.keyword === 'ドキュメント作成'
    );
    expect(singleDocIssue).toBeDefined();
    expect(singleDocIssue.mergedFlag).toBe(false);
    expect(singleDocIssue.sourceReports).toEqual(['report_003']);
    expect(singleDocIssue.frequency).toBe(1);
    expect(singleDocIssue.priorityScore).toBe(42);

    // 総件数（ユニークな課題数）
    expect(result.totalIssueCount).toBe(2);

    // 分析実行時刻がISO 8601形式
    expect(result.analysisExecutedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // データ品質スコアが0～100の範囲
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // 優先度でソート（降順）
    if (result.keywords.length > 1) {
      for (let i = 0; i < result.keywords.length - 1; i++) {
        expect(result.keywords[i].priorityScore).toBeGreaterThanOrEqual(
          result.keywords[i + 1].priorityScore
        );
      }
    }
  });
});