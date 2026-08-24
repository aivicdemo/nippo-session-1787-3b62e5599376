import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次データ集約・アーカイブ機能', () => {
  // SCEN-2389: [normal] 日報データ集約・アーカイブ機能 - 指定された集約期間内の日報データが現用領域に保持される
  test('should keep aggregation period data in active area and archive out-of-period data', () => {
    // 集約期間: 2024年1月1日～2024年1月31日
    const aggregation_start_date = new Date('2024-01-01T00:00:00Z');
    const aggregation_end_date = new Date('2024-01-31T23:59:59Z');

    // 集約期間内に作成された日報データ 10 件
    const in_period_reports = [
      {
        report_id: 'report_in_001',
        created_date: new Date('2024-01-15T09:00:00Z'),
        yesterday_accomplishment: 'API開発完了',
        todays_plan: 'テスト実施',
        issues: 'データベース接続エラー',
      },
      {
        report_id: 'report_in_002',
        created_date: new Date('2024-01-10T10:30:00Z'),
        yesterday_accomplishment: 'UI修正',
        todays_plan: 'レビュー対応',
        issues: 'ブラウザ互換性',
      },
      {
        report_id: 'report_in_003',
        created_date: new Date('2024-01-20T11:15:00Z'),
        yesterday_accomplishment: 'ドキュメント作成',
        todays_plan: 'デプロイ準備',
        issues: 'ステージング環境エラー',
      },
      {
        report_id: 'report_in_004',
        created_date: new Date('2024-01-05T08:45:00Z'),
        yesterday_accomplishment: 'バグ修正',
        todays_plan: 'QA確認',
        issues: 'リグレッションテスト失敗',
      },
      {
        report_id: 'report_in_005',
        created_date: new Date('2024-01-25T14:20:00Z'),
        yesterday_accomplishment: 'コードレビュー',
        todays_plan: 'マージ実施',
        issues: 'コンフリクト解決',
      },
      {
        report_id: 'report_in_006',
        created_date: new Date('2024-01-08T09:30:00Z'),
        yesterday_accomplishment: 'ログ出力追加',
        todays_plan: 'デバッグ',
        issues: 'パフォーマンス低下',
      },
      {
        report_id: 'report_in_007',
        created_date: new Date('2024-01-18T10:00:00Z'),
        yesterday_accomplishment: 'ユーザー調査',
        todays_plan: 'フィードバック反映',
        issues: 'スコープ拡大',
      },
      {
        report_id: 'report_in_008',
        created_date: new Date('2024-01-12T11:45:00Z'),
        yesterday_accomplishment: 'テスト自動化',
        todays_plan: 'CI/CD統合',
        issues: 'テスト失敗率高い',
      },
      {
        report_id: 'report_in_009',
        created_date: new Date('2024-01-22T13:10:00Z'),
        yesterday_accomplishment: 'セキュリティ監査',
        todays_plan: '脆弱性対応',
        issues: 'SQL インジェクション検出',
      },
      {
        report_id: 'report_in_010',
        created_date: new Date('2024-01-28T15:30:00Z'),
        yesterday_accomplishment: 'エラーハンドリング改善',
        todays_plan: 'リリース準備',
        issues: 'エッジケース対応',
      },
    ];

    // 集約期間外に作成されたデータ: 2023年12月25日分 5 件
    const before_period_reports = [
      {
        report_id: 'report_before_001',
        created_date: new Date('2023-12-25T09:00:00Z'),
        yesterday_accomplishment: '年末対応',
        todays_plan: '休暇',
        issues: 'なし',
      },
      {
        report_id: 'report_before_002',
        created_date: new Date('2023-12-25T10:00:00Z'),
        yesterday_accomplishment: '最終確認',
        todays_plan: 'リリース',
        issues: 'ホットフィックス必要',
      },
      {
        report_id: 'report_before_003',
        created_date: new Date('2023-12-25T11:00:00Z'),
        yesterday_accomplishment: '手動テスト',
        todays_plan: '報告',
        issues: 'バグ残存',
      },
      {
        report_id: 'report_before_004',
        created_date: new Date('2023-12-25T12:00:00Z'),
        yesterday_accomplishment: 'デプロイ',
        todays_plan: 'モニタリング',
        issues: 'レスポンス遅延',
      },
      {
        report_id: 'report_before_005',
        created_date: new Date('2023-12-25T13:00:00Z'),
        yesterday_accomplishment: 'ログ確認',
        todays_plan: 'チューニング',
        issues: 'メモリリーク',
      },
    ];

    // 集約期間外に作成されたデータ: 2024年2月5日分 5 件
    const after_period_reports = [
      {
        report_id: 'report_after_001',
        created_date: new Date('2024-02-05T09:00:00Z'),
        yesterday_accomplishment: '新機能設計',
        todays_plan: '実装開始',
        issues: 'スケジュール短い',
      },
      {
        report_id: 'report_after_002',
        created_date: new Date('2024-02-05T10:00:00Z'),
        yesterday_accomplishment: 'マイグレーション完了',
        todays_plan: '検証',
        issues: 'データロス確認',
      },
      {
        report_id: 'report_after_003',
        created_date: new Date('2024-02-05T11:00:00Z'),
        yesterday_accomplishment: '負荷テスト実施',
        todays_plan: '結果分析',
        issues: 'ボトルネック発見',
      },
      {
        report_id: 'report_after_004',
        created_date: new Date('2024-02-05T12:00:00Z'),
        yesterday_accomplishment: 'ドキュメント更新',
        todays_plan: 'トレーニング',
        issues: '理解度不足',
      },
      {
        report_id: 'report_after_005',
        created_date: new Date('2024-02-05T13:00:00Z'),
        yesterday_accomplishment: 'フィードバック収集',
        todays_plan: '改善計画',
        issues: 'ユーザー要望多数',
      },
    ];

    // 集約期間内外のすべてのデータを現用領域に事前登録
    const all_reports = [
      ...in_period_reports,
      ...before_period_reports,
      ...after_period_reports,
    ];

    // 日報データ集約・アーカイブ処理を実行
    const result = extractMonthlyReportData(
      aggregation_start_date,
      aggregation_end_date,
      all_reports
    );

    // 検証 1: 集約期間内のデータが現用領域に保持されている
    expect(result.active_area_reports).toHaveLength(10);

    // 検証 2: 集約期間内の各レコードが正しく保持されている
    const in_period_ids = in_period_reports.map((r) => r.report_id);
    result.active_area_reports.forEach((report) => {
      expect(in_period_ids).toContain(report.report_id);
    });

    // 検証 3: 集約期間内データの主キー・作成日時・報告内容が変更されていない
    in_period_reports.forEach((original_report) => {
      const retained_report = result.active_area_reports.find(
        (r) => r.report_id === original_report.report_id
      );
      expect(retained_report).toBeDefined();
      expect(retained_report?.report_id).toBe(original_report.report_id);
      expect(retained_report?.created_date).toEqual(original_report.created_date);
      expect(retained_report?.yesterday_accomplishment).toBe(
        original_report.yesterday_accomplishment
      );
      expect(retained_report?.todays_plan).toBe(original_report.todays_plan);
      expect(retained_report?.issues).toBe(original_report.issues);
    });

    // 検証 4: 集約期間外のデータがアーカイブ領域に移動している
    expect(result.archived_reports).toHaveLength(10);

    // 検証 5: アーカイブされたデータが期間外のデータであることを確認
    const before_and_after_ids = [
      ...before_period_reports.map((r) => r.report_id),
      ...after_period_reports.map((r) => r.report_id),
    ];
    result.archived_reports.forEach((report) => {
      expect(before_and_after_ids).toContain(report.report_id);
    });

    // 検証 6: アーカイブされたデータも主キー・作成日時・報告内容が変更されていない
    const all_archived_originals = [
      ...before_period_reports,
      ...after_period_reports,
    ];
    all_archived_originals.forEach((original_report) => {
      const archived_report = result.archived_reports.find(
        (r) => r.report_id === original_report.report_id
      );
      expect(archived_report).toBeDefined();
      expect(archived_report?.report_id).toBe(original_report.report_id);
      expect(archived_report?.created_date).toEqual(original_report.created_date);
      expect(archived_report?.yesterday_accomplishment).toBe(
        original_report.yesterday_accomplishment
      );
      expect(archived_report?.todays_plan).toBe(original_report.todays_plan);
      expect(archived_report?.issues).toBe(original_report.issues);
    });

    // 検証 7: 現用領域と過去領域が相互に排他的
    const active_ids = result.active_area_reports.map((r) => r.report_id);
    const archived_ids = result.archived_reports.map((r) => r.report_id);
    const intersection = active_ids.filter((id) => archived_ids.includes(id));
    expect(intersection).toHaveLength(0);

    // 検証 8: 全データが保持されている（ロスなし）
    expect(result.active_area_reports.length + result.archived_reports.length).toBe(
      all_reports.length
    );
  });
});