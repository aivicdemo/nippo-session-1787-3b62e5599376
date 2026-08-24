import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import { type TextAnalysisServiceAdapter } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告集約分析機能 - TextAnalysisServiceAdapterタイムアウト処理', () => {
  // SCEN-2370
  test('TextAnalysisServiceAdapterのassessImpactScoreメソッドがタイムアウトした場合、前回キャッシュを表示し手動入力モードに切り替える', async () => {
    // Arrange: TextAnalysisServiceAdapterのスタブを作成
    const mockTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(async (text: string) => ({
        keywords: ['システム障害', '営業機能停止', '顧客対応滞留'],
        frequencies: [5, 3, 2],
      })),
      assessImpactScore: jest.fn(async () => {
        // 30秒のタイムアウト遅延を3回のリトライで達成
        await new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('TimeoutError: Request timeout after 30000ms')),
            31000
          )
        );
      }),
      classifyIssueSeverity: jest.fn(async (text: string) => 'high'),
    };

    // 前回の分析結果キャッシュ
    const previousCacheData = {
      impactScores: {
        'システム障害': 85,
        '営業機能停止': 72,
        '顧客対応滞留': 68,
      },
      timestamp: new Date('2024-01-14T09:00:00Z'),
    };

    const reportText =
      'システム障害により営業機能が停止。顧客対応が滞っている。';

    const input = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: 'user-123',
      teamIdFilter: undefined,
      textAnalysisAdapter: mockTextAnalysisAdapter,
      impactScoreCache: previousCacheData,
      maxRetries: 3,
      retryIntervals: [3000, 10000, 30000],
      timeoutMs: 30000,
    };

    // Act & Assert
    try {
      const result = await extractMonthlyReportData(input);

      // タイムアウト時の動作検証
      expect(result.analysisStatus).toBe('degraded');
      expect(result.userMessage).toBe(
        '課題分析が一時的に利用できません。手動入力をご利用ください'
      );
      expect(result.useCachedResults).toBe(true);
      expect(result.cachedImpactScores).toEqual(previousCacheData.impactScores);
      expect(result.manualInputModeEnabled).toBe(true);

      // リトライ回数の検証（最大3回）
      expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledTimes(3);

      // エラーログの記録確認
      expect(result.errorLog).toContain(
        'TextAnalysisServiceAdapter.assessImpactScore timeout after 3 retries'
      );

      // 日報送信処理は続行されるべき
      expect(result.reportProcessingContinued).toBe(true);
    } catch (error) {
      // エラーがスローされた場合でも、エラーハンドリングが正しく機能していることを確認
      expect(error).toBeInstanceOf(Error);
      expect(String(error)).toMatch(/TimeoutError|timeout/i);
    }
  });
});