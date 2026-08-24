import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-1483
  test('同じ前週7日間の日報データで2回実行した場合、同じ課題リストが生成される', () => {
    // テストデータ準備: 前週7日間（月～日）の日報データ10件
    const mockReports = [
      {
        reportId: 'report_001',
        teamId: 'team_dev_01',
        userId: 'user_001',
        reportedDate: new Date('2024-01-08T09:00:00Z'),
        yesterdayAccomplishment: 'APIの実装完了、テスト実施',
        todayPlan: 'バグ修正、ドキュメント作成',
        challenges: 'データベースパフォーマンスの問題、ネットワークレイテンシ',
        submittedAt: new Date('2024-01-08T08:30:00Z'),
      },
      {
        reportId: 'report_002',
        teamId: 'team_dev_01',
        userId: 'user_002',
        reportedDate: new Date('2024-01-08T09:00:00Z'),
        yesterdayAccomplishment: 'UI修正とレビュー対応',
        todayPlan: 'フロントエンド統合テスト',
        challenges: 'ネットワークレイテンシ、デプロイメント設定',
        submittedAt: new Date('2024-01-08T08:45:00Z'),
      },
      {
        reportId: 'report_003',
        teamId: 'team_dev_01',
        userId: 'user_003',
        reportedDate: new Date('2024-01-09T09:00:00Z'),
        yesterdayAccomplishment: 'データベース最適化',
        todayPlan: 'パフォーマンステスト',
        challenges: 'データベースパフォーマンスの問題、メモリリーク検出',
        submittedAt: new Date('2024-01-09T08:30:00Z'),
      },
      {
        reportId: 'report_004',
        teamId: 'team_dev_01',
        userId: 'user_004',
        reportedDate: new Date('2024-01-09T09:00:00Z'),
        yesterdayAccomplishment: 'リリース準備',
        todayPlan: 'リリース実施',
        challenges: 'デプロイメント設定の確認、リグレッション懸念',
        submittedAt: new Date('2024-01-09T08:40:00Z'),
      },
      {
        reportId: 'report_005',
        teamId: 'team_dev_01',
        userId: 'user_005',
        reportedDate: new Date('2024-01-10T09:00:00Z'),
        yesterdayAccomplishment: '品質改善',
        todayPlan: 'テスト実施',
        challenges: 'データベースパフォーマンスの問題',
        submittedAt: new Date('2024-01-10T08:35:00Z'),
      },
      {
        reportId: 'report_006',
        teamId: 'team_dev_01',
        userId: 'user_006',
        reportedDate: new Date('2024-01-10T09:00:00Z'),
        yesterdayAccomplishment: 'インフラ構築',
        todayPlan: 'モニタリング設定',
        challenges: 'ネットワークレイテンシ、サーバリソース不足',
        submittedAt: new Date('2024-01-10T08:50:00Z'),
      },
      {
        reportId: 'report_007',
        teamId: 'team_dev_01',
        userId: 'user_007',
        reportedDate: new Date('2024-01-11T09:00:00Z'),
        yesterdayAccomplishment: '機能実装',
        todayPlan: '統合テスト',
        challenges: 'メモリリーク検出、デプロイメント設定',
        submittedAt: new Date('2024-01-11T08:30:00Z'),
      },
      {
        reportId: 'report_008',
        teamId: 'team_dev_01',
        userId: 'user_008',
        reportedDate: new Date('2024-01-11T09:00:00Z'),
        yesterdayAccomplishment: 'ドキュメント更新',
        todayPlan: 'レビュー対応',
        challenges: 'ネットワークレイテンシ',
        submittedAt: new Date('2024-01-11T08:45:00Z'),
      },
      {
        reportId: 'report_009',
        teamId: 'team_dev_01',
        userId: 'user_009',
        reportedDate: new Date('2024-01-12T09:00:00Z'),
        yesterdayAccomplishment: 'バグ修正',
        todayPlan: 'リグレッションテスト',
        challenges: 'データベースパフォーマンスの問題、リグレッション懸念',
        submittedAt: new Date('2024-01-12T08:40:00Z'),
      },
      {
        reportId: 'report_010',
        teamId: 'team_dev_01',
        userId: 'user_010',
        reportedDate: new Date('2024-01-12T09:00:00Z'),
        yesterdayAccomplishment: 'セキュリティレビュー',
        todayPlan: '脆弱性対応',
        challenges: 'メモリリーク検出',
        submittedAt: new Date('2024-01-12T08:55:00Z'),
      },
    ];

    // TextAnalysisServiceAdapterのextractKeywordsメソッドをスタブ化
    const stubTextAnalysisAdapter = {
      extractKeywords: jest.fn(() => {
        return [
          { keyword: 'データベースパフォーマンスの問題', frequency: 4 },
          { keyword: 'ネットワークレイテンシ', frequency: 4 },
          { keyword: 'デプロイメント設定', frequency: 3 },
          { keyword: 'メモリリーク検出', frequency: 3 },
          { keyword: 'リグレッション懸念', frequency: 2 },
        ];
      }),
      assessImpactScore: jest.fn(() => 75),
      classifyIssueSeverity: jest.fn(() => 'high'),
    };

    // 1回目の実行
    const input1: ExtractIssueKeywordsInput = {
      teamId: 'team_dev_01',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user_pm_01',
    };

    const result1 = extractAndRankIssueKeywords(input1, mockReports, stubTextAnalysisAdapter);

    // 1回目の結果を保存
    const keywordsList1 = result1.keywords;
    const totalCount1 = result1.totalKeywordCount;
    const analysisperiodDays1 = result1.analysisperiodDays;

    // 2回目の実行（同じ入力条件、スタブの戻り値は1回目と同じ）
    const input2: ExtractIssueKeywordsInput = {
      teamId: 'team_dev_01',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user_pm_01',
    };

    const result2 = extractAndRankIssueKeywords(input2, mockReports, stubTextAnalysisAdapter);

    // 2回目の結果を保存
    const keywordsList2 = result2.keywords;
    const totalCount2 = result2.totalKeywordCount;
    const analysisperiodDays2 = result2.analysisperiodDays;

    // ディープ比較：キーワード名、出現頻度、ランク順序が完全一致することを確認
    expect(keywordsList1).toEqual(keywordsList2);
    expect(keywordsList1).toHaveLength(5);
    expect(keywordsList2).toHaveLength(5);

    // 出現頻度で降順になっていることを確認
    for (let i = 0; i < keywordsList1.length - 1; i++) {
      expect(keywordsList1[i].frequency).toBeGreaterThanOrEqual(
        keywordsList1[i + 1].frequency
      );
    }

    // ランク値が1から開始し、連番になっていることを確認
    for (let i = 0; i < keywordsList1.length; i++) {
      expect(keywordsList1[i].rank).toBe(i + 1);
    }

    // 総キーワード数が一致
    expect(totalCount1).toBe(totalCount2);
    expect(totalCount1).toBe(5);

    // 分析対象期間の日数が一致
    expect(analysisperiodDays1).toBe(analysisperiodDays2);
    expect(analysisperiodDays1).toBe(7);

    // 具体的なキーワード内容の確認
    expect(keywordsList1[0].keyword).toBe('データベースパフォーマンスの問題');
    expect(keywordsList1[0].frequency).toBe(4);
    expect(keywordsList1[0].rank).toBe(1);

    expect(keywordsList1[1].keyword).toBe('ネットワークレイテンシ');
    expect(keywordsList1[1].frequency).toBe(4);
    expect(keywordsList1[1].rank).toBe(2);

    expect(keywordsList1[2].keyword).toBe('デプロイメント設定');
    expect(keywordsList1[2].frequency).toBe(3);
    expect(keywordsList1[2].rank).toBe(3);

    expect(keywordsList1[3].keyword).toBe('メモリリーク検出');
    expect(keywordsList1[3].frequency).toBe(3);
    expect(keywordsList1[3].rank).toBe(4);

    expect(keywordsList1[4].keyword).toBe('リグレッション懸念');
    expect(keywordsList1[4].frequency).toBe(2);
    expect(keywordsList1[4].rank).toBe(5);

    // extractedAtが設定されていることを確認
    expect(result1.extractedAt).toBeInstanceOf(Date);
    expect(result2.extractedAt).toBeInstanceOf(Date);
  });
});