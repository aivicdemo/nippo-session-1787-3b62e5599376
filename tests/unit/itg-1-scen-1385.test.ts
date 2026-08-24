import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import { type DailyReport } from '../../src/logic/issue-analysis';

describe('課題の影響度判定と優先度スコア順序付け', () => {
  // SCEN-1385: TextAnalysisServiceAdapter が失敗したとき影響度判定が中止される
  test('テキスト分析サービスが例外をスローした場合、影響度判定処理が中止され、キャッシュ結果が表示される', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(async (text: string) => {
        return [
          { keyword: 'データベース接続エラー', frequency: 3 },
          { keyword: 'ネットワーク遅延', frequency: 2 }
        ];
      }),
      assessImpactScore: jest.fn(async (keyword: string) => {
        throw new Error('Impact assessment API failed');
      }),
      classifyIssueSeverity: jest.fn()
    };

    const testReportDataList: DailyReport[] = [
      {
        reportId: 'report-001',
        userId: 'user-001',
        reportDate: '2024-01-15',
        yesterday: 'APIサーバーの修正対応',
        today: 'テスト環境構築',
        issues: 'データベース接続エラーが発生。ネットワーク遅延も観測',
        submittedAt: '2024-01-15T09:00:00Z'
      }
    ];

    const mockCachedResult = {
      keywords: [
        { keyword: 'データベース接続エラー', frequency: 3, priorityScore: 75, priorityColor: 'red' },
        { keyword: 'ネットワーク遅延', frequency: 2, priorityScore: 55, priorityColor: 'yellow' }
      ],
      totalIssueCount: 2,
      analysisExecutedAt: '2024-01-15T08:30:00Z',
      dataQualityScore: 85,
      cachedResult: true,
      impactAssessmentError: true
    };

    const result = await extractAndRankIssueKeywords(
      testReportDataList,
      '2024-01-08',
      '2024-01-15',
      1,
      mockTextAnalysisServiceAdapter,
      mockCachedResult
    );

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
    expect(result.keywords).toHaveLength(2);
    expect(result.keywords[0]).toEqual({
      keyword: 'データベース接続エラー',
      frequency: 3,
      priorityScore: 75,
      priorityColor: 'red'
    });
    expect(result.keywords[1]).toEqual({
      keyword: 'ネットワーク遅延',
      frequency: 2,
      priorityScore: 55,
      priorityColor: 'yellow'
    });
    expect(result.totalIssueCount).toBe(2);
    expect(result.dataQualityScore).toBe(85);
    expect(result.cachedResult).toBe(true);
    expect(result.impactAssessmentError).toBe(true);
  });
});