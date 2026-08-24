import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import { type MonthlyReportDataset } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート生成機能', () => {
  // SCEN-1794: [normal] 月次レポート生成機能 - 同じ前月データで月次レポート生成を2回実行しても同一の結果が得られる
  test('should generate identical monthly reports when called twice with the same input data and mock configuration', () => {
    const targetYear = 2024;
    const targetMonth = 11;
    const requestedByUserId = 'user-001';

    // セットアップ: テスト用データセット（前月2024年11月の日報データ100件）
    const mockReportRecords = Array.from({ length: 100 }, (_, index) => ({
      reportId: `report-${String(index + 1).padStart(3, '0')}`,
      reportDate: new Date(`2024-11-${String((index % 30) + 1).padStart(2, '0')}T09:00:00Z`),
      teamId: `team-${(index % 5) + 1}`,
      authorUserId: `user-${(index % 10) + 1}`,
      yesterdayAccomplishment: `Completed task ${index + 1}`,
      todayPlan: `Plan task ${index + 1}`,
      issue: `Issue keyword ${(index % 15) + 1}`,
      submittedAt: new Date(`2024-11-${String((index % 30) + 1).padStart(2, '0')}T09:30:00Z`),
    }));

    // TextAnalysisServiceAdapterのモック定義
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockImplementation((text: string) => {
        return {
          keywords: ['keyword_A', 'keyword_B', 'keyword_C'],
          frequencies: [15, 12, 8],
        };
      }),
      assessImpactScore: jest.fn().mockImplementation((keyword: string) => {
        const scoreMap: Record<string, number> = {
          keyword_A: 85.5,
          keyword_B: 72.3,
          keyword_C: 61.7,
        };
        return scoreMap[keyword] || 50.0;
      }),
      classifyIssueSeverity: jest.fn().mockImplementation((keyword: string) => {
        const severityMap: Record<string, 'high' | 'medium' | 'low'> = {
          keyword_A: 'high',
          keyword_B: 'medium',
          keyword_C: 'low',
        };
        return severityMap[keyword] || 'medium';
      }),
    };

    // 第1回呼び出し: レポートA生成
    const reportA = extractMonthlyReportData(
      {
        targetYear,
        targetMonth,
        requestedByUserId,
        teamIdFilter: undefined,
      },
      mockReportRecords,
      mockTextAnalysisAdapter
    );

    // レポートAの内容をメモリに保存
    const reportA_keywords = [...reportA.extractedKeywords];
    const reportA_frequencies = [...reportA.keywordFrequencies];
    const reportA_impactScores = [...reportA.impactScores];
    const reportA_severities = [...reportA.severities];
    const reportA_totalCount = reportA.totalReportCount;
    const reportA_averageScore = reportA.averageImpactScore;
    const reportA_extractedAt = reportA.extractedAt;

    // テスト用データベース再初期化（同一データで再セットアップ）
    const mockReportRecordsReinitialize = Array.from({ length: 100 }, (_, index) => ({
      reportId: `report-${String(index + 1).padStart(3, '0')}`,
      reportDate: new Date(`2024-11-${String((index % 30) + 1).padStart(2, '0')}T09:00:00Z`),
      teamId: `team-${(index % 5) + 1}`,
      authorUserId: `user-${(index % 10) + 1}`,
      yesterdayAccomplishment: `Completed task ${index + 1}`,
      todayPlan: `Plan task ${index + 1}`,
      issue: `Issue keyword ${(index % 15) + 1}`,
      submittedAt: new Date(`2024-11-${String((index % 30) + 1).padStart(2, '0')}T09:30:00Z`),
    }));

    // TextAnalysisServiceAdapterのモック設定が同一であることを確認
    expect(mockTextAnalysisAdapter.extractKeywords).toBeDefined();
    expect(mockTextAnalysisAdapter.assessImpactScore).toBeDefined();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).toBeDefined();

    // 第2回呼び出し: レポートB生成（同一パラメータ）
    const reportB = extractMonthlyReportData(
      {
        targetYear,
        targetMonth,
        requestedByUserId,
        teamIdFilter: undefined,
      },
      mockReportRecordsReinitialize,
      mockTextAnalysisAdapter
    );

    // レポートAとレポートBの全項目を項目ごとに比較
    // (1) 抽出された課題キーワードが同一順序かつ同一出現頻度
    expect(reportB.extractedKeywords).toEqual(reportA_keywords);
    expect(reportB.keywordFrequencies).toEqual(reportA_frequencies);

    // (2) 全キーワードのチーム波及度スコア（0-100）が小数点第1位まで一致
    expect(reportB.impactScores.length).toBe(reportA_impactScores.length);
    reportB.impactScores.forEach((score, index) => {
      expect(Math.round(score * 10) / 10).toBe(Math.round(reportA_impactScores[index] * 10) / 10);
    });

    // (3) 重要度分類結果（高・中・低）がキーワードごとに同一
    expect(reportB.severities).toEqual(reportA_severities);

    // (4) レポートの統計集計値（合計件数、平均スコア等）が完全に一致
    expect(reportB.totalReportCount).toBe(reportA_totalCount);
    expect(reportB.averageImpactScore).toBe(reportA_averageScore);

    // 両レポートの抽出時刻は異なる可能性があるため、フォーマットが正しいことのみ確認
    expect(reportB.extractedAt).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
    expect(reportA_extractedAt).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);

    // idempotency の検証: 複数回呼び出しても結果が同じであることを確認
    const reportC = extractMonthlyReportData(
      {
        targetYear,
        targetMonth,
        requestedByUserId,
        teamIdFilter: undefined,
      },
      mockReportRecordsReinitialize,
      mockTextAnalysisAdapter
    );

    expect(reportC.extractedKeywords).toEqual(reportB.extractedKeywords);
    expect(reportC.keywordFrequencies).toEqual(reportB.keywordFrequencies);
    expect(reportC.impactScores.length).toBe(reportB.impactScores.length);
    reportC.impactScores.forEach((score, index) => {
      expect(Math.round(score * 10) / 10).toBe(Math.round(reportB.impactScores[index] * 10) / 10);
    });
    expect(reportC.severities).toEqual(reportB.severities);
    expect(reportC.totalReportCount).toBe(reportB.totalReportCount);
    expect(reportC.averageImpactScore).toBe(reportB.averageImpactScore);
  });
});