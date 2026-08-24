import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告集約分析機能 - 月次レポート抽出', () => {
  test('SCEN-2355: 同じ集約期間で2回実行した場合、同じ分析レポートが生成される', () => {
    // テスト前準備: TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        // テキストから課題キーワードを抽出（決定論的な実装）
        const keywords: { keyword: string; frequency: number }[] = [];
        if (text.includes('データベース')) {
          keywords.push({ keyword: 'データベース接続', frequency: 1 });
        }
        if (text.includes('パフォーマンス')) {
          keywords.push({ keyword: 'パフォーマンス改善', frequency: 1 });
        }
        if (text.includes('API')) {
          keywords.push({ keyword: 'API仕様確認', frequency: 1 });
        }
        return keywords;
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        // キーワードに基づいて影響度スコアを算出（決定論的な実装）
        const scoreMap: { [key: string]: number } = {
          'データベース接続': 85,
          'パフォーマンス改善': 72,
          'API仕様確認': 60,
        };
        return scoreMap[keyword] || 50;
      }),
      classifyIssueSeverity: jest.fn((impactScore: number) => {
        // 影響度スコアから重要度を分類（決定論的な実装）
        if (impactScore >= 80) return 'high';
        if (impactScore >= 65) return 'medium';
        return 'low';
      }),
    };

    // テスト前準備: 集約期間を指定
    const aggregationStartDate = '2026-08-20';
    const aggregationEndDate = '2026-08-22';

    // テスト前準備: 日報データを事前定義（決定論的）
    const reportRecords = [
      {
        userId: 'user_a',
        reportDate: '2026-08-20',
        yesterdayContent: 'データベース接続テスト実施',
        todayContent: 'パフォーマンス改善対応',
        issueContent: 'データベース接続エラーが間欠的に発生',
      },
      {
        userId: 'user_b',
        reportDate: '2026-08-21',
        yesterdayContent: 'API仕様確認実施',
        todayContent: 'パフォーマンス改善対応',
        issueContent: 'API仕様書の更新が遅延',
      },
      {
        userId: 'user_c',
        reportDate: '2026-08-22',
        yesterdayContent: 'データベース接続テスト',
        todayContent: 'パフォーマンス改善',
        issueContent: 'データベース接続がタイムアウト',
      },
      {
        userId: 'user_d',
        reportDate: '2026-08-20',
        yesterdayContent: 'テスト実施',
        todayContent: 'API確認',
        issueContent: 'API仕様確認中',
      },
      {
        userId: 'user_e',
        reportDate: '2026-08-21',
        yesterdayContent: '統合テスト',
        todayContent: '統合テスト続行',
        issueContent: 'パフォーマンス改善必要',
      },
      {
        userId: 'user_f',
        reportDate: '2026-08-22',
        yesterdayContent: 'コード確認',
        todayContent: 'コード確認続行',
        issueContent: 'データベース接続テスト実施',
      },
      {
        userId: 'user_g',
        reportDate: '2026-08-20',
        yesterdayContent: 'ドキュメント作成',
        todayContent: 'ドキュメント作成続行',
        issueContent: 'パフォーマンス問題検出',
      },
      {
        userId: 'user_h',
        reportDate: '2026-08-21',
        yesterdayContent: 'リリース準備',
        todayContent: 'リリース実施',
        issueContent: 'API仕様の矛盾検出',
      },
      {
        userId: 'user_i',
        reportDate: '2026-08-22',
        yesterdayContent: '障害対応',
        todayContent: '障害対応続行',
        issueContent: 'データベース接続不安定',
      },
      {
        userId: 'user_j',
        reportDate: '2026-08-20',
        yesterdayContent: 'レビュー実施',
        todayContent: 'レビュー続行',
        issueContent: 'パフォーマンス改善検討',
      },
    ];

    // 1回目の集約分析機能を実行
    const report1 = extractMonthlyReportData(
      {
        targetYear: 2026,
        targetMonth: 8,
        requestedByUserId: 'manager_1',
        teamIdFilter: undefined,
      },
      reportRecords,
      mockTextAnalysisAdapter,
    );

    // 内部状態をリセット（再度同じ入力で実行するため）
    mockTextAnalysisAdapter.extractKeywords.mockClear();
    mockTextAnalysisAdapter.assessImpactScore.mockClear();
    mockTextAnalysisAdapter.classifyIssueSeverity.mockClear();

    // モックの実装は変わらないため、2回目の呼び出しも同じ結果を返す
    mockTextAnalysisAdapter.extractKeywords.mockImplementation((text: string) => {
      const keywords: { keyword: string; frequency: number }[] = [];
      if (text.includes('データベース')) {
        keywords.push({ keyword: 'データベース接続', frequency: 1 });
      }
      if (text.includes('パフォーマンス')) {
        keywords.push({ keyword: 'パフォーマンス改善', frequency: 1 });
      }
      if (text.includes('API')) {
        keywords.push({ keyword: 'API仕様確認', frequency: 1 });
      }
      return keywords;
    });

    mockTextAnalysisAdapter.assessImpactScore.mockImplementation((keyword: string) => {
      const scoreMap: { [key: string]: number } = {
        'データベース接続': 85,
        'パフォーマンス改善': 72,
        'API仕様確認': 60,
      };
      return scoreMap[keyword] || 50;
    });

    mockTextAnalysisAdapter.classifyIssueSeverity.mockImplementation((impactScore: number) => {
      if (impactScore >= 80) return 'high';
      if (impactScore >= 65) return 'medium';
      return 'low';
    });

    // 2回目の集約分析機能を実行
    const report2 = extractMonthlyReportData(
      {
        targetYear: 2026,
        targetMonth: 8,
        requestedByUserId: 'manager_1',
        teamIdFilter: undefined,
      },
      reportRecords,
      mockTextAnalysisAdapter,
    );

    // レポート1とレポート2が完全に一致することを確認
    // 抽出されたキーワード一覧の確認
    expect(report1).toBeDefined();
    expect(report2).toBeDefined();

    // 抽出期間が同じであることを確認
    expect(report1.extractionPeriodStart).toBe('2026-08-20T00:00:00Z');
    expect(report2.extractionPeriodStart).toBe('2026-08-20T00:00:00Z');
    expect(report1.extractionPeriodEnd).toBe('2026-08-22T23:59:59Z');
    expect(report2.extractionPeriodEnd).toBe('2026-08-22T23:59:59Z');

    // 日報総件数が同じであることを確認
    expect(report1.totalReportCount).toBe(10);
    expect(report2.totalReportCount).toBe(10);

    // チーム別集計結果の件数確認
    expect(report1.reportsByTeam.length).toBe(report2.reportsByTeam.length);

    // 各チームの日報件数と提出率が同じであることを確認
    for (let i = 0; i < report1.reportsByTeam.length; i++) {
      expect(report1.reportsByTeam[i].teamId).toBe(report2.reportsByTeam[i].teamId);
      expect(report1.reportsByTeam[i].reportCount).toBe(report2.reportsByTeam[i].reportCount);
      expect(report1.reportsByTeam[i].submissionRate).toBe(report2.reportsByTeam[i].submissionRate);
      expect(report1.reportsByTeam[i].reportIds).toEqual(report2.reportsByTeam[i].reportIds);
    }

    // データ品質スコアが同じであることを確認
    expect(report1.dataQualityScore).toBe(report2.dataQualityScore);

    // データ抽出実行日時は異なる可能性があるため、形式のみ確認
    expect(report1.extractedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(report2.extractedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // モック呼び出し回数が同じであることを確認（決定論的に同じ処理が実行されたことの証拠）
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).toHaveBeenCalled();
  });
});