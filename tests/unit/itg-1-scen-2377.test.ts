import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2377: [edge] 朝会報告集約分析機能 - 集約期間の開始日が月末、終了日が翌月初のとき、期間内のすべての日報を抽出する
  test('集約期間が月末から翌月初にかかる場合、期間内のすべての日報を正確に抽出する', () => {
    // 集約期間: 2025年1月31日 00:00 ～ 2025年2月2日 23:59
    const aggregationStartDate = new Date('2025-01-31T00:00:00Z');
    const aggregationEndDate = new Date('2025-02-02T23:59:59Z');

    // 2025年1月31日（金）の日報 5件
    const reportData_jan31_1 = {
      reportId: 'rep_20250131_001',
      userId: 'user_001',
      submittedAt: new Date('2025-01-31T08:30:00Z'),
      yesterday: 'APIのユーザー認証機能を完成させた',
      today: 'データベース接続テストを実施する',
      issues: 'SQLクエリの最適化に時間がかかっている',
    };
    const reportData_jan31_2 = {
      reportId: 'rep_20250131_002',
      userId: 'user_002',
      submittedAt: new Date('2025-01-31T08:45:00Z'),
      yesterday: 'フロントエンド画面デザインを修正',
      today: 'ユーザーインタフェーステストを実施',
      issues: 'ブラウザ互換性問題が発生している',
    };
    const reportData_jan31_3 = {
      reportId: 'rep_20250131_003',
      userId: 'user_003',
      submittedAt: new Date('2025-01-31T09:00:00Z'),
      yesterday: 'ドキュメント作成',
      today: 'レビュー対応',
      issues: 'レビュー指摘が多い',
    };
    const reportData_jan31_4 = {
      reportId: 'rep_20250131_004',
      userId: 'user_004',
      submittedAt: new Date('2025-01-31T09:15:00Z'),
      yesterday: 'パフォーマンステスト実施',
      today: '改善施策の検討',
      issues: '応答時間が基準値を超えている',
    };
    const reportData_jan31_5 = {
      reportId: 'rep_20250131_005',
      userId: 'user_005',
      submittedAt: new Date('2025-01-31T09:30:00Z'),
      yesterday: 'セキュリティ脆弱性スキャン実施',
      today: '脆弱性修正計画を立案',
      issues: '重大度Highの脆弱性が検出された',
    };

    // 2025年2月1日（土）の日報 3件
    const reportData_feb01_1 = {
      reportId: 'rep_20250201_001',
      userId: 'user_001',
      submittedAt: new Date('2025-02-01T08:30:00Z'),
      yesterday: 'データベース接続テストを完了',
      today: 'キャッシング層を実装する',
      issues: 'SQLクエリの最適化に時間がかかっている',
    };
    const reportData_feb01_2 = {
      reportId: 'rep_20250201_002',
      userId: 'user_002',
      submittedAt: new Date('2025-02-01T08:45:00Z'),
      yesterday: 'ユーザーインタフェーステスト実施',
      today: 'UI修正を実装する',
      issues: 'ブラウザ互換性問題が発生している',
    };
    const reportData_feb01_3 = {
      reportId: 'rep_20250201_003',
      userId: 'user_006',
      submittedAt: new Date('2025-02-01T09:00:00Z'),
      yesterday: 'バックアップシステムの監視',
      today: 'ディスク容量の最適化',
      issues: 'ストレージ不足の警告が頻出',
    };

    // 2025年2月2日（日）の日報 4件
    const reportData_feb02_1 = {
      reportId: 'rep_20250202_001',
      userId: 'user_003',
      submittedAt: new Date('2025-02-02T08:30:00Z'),
      yesterday: 'レビュー指摘対応',
      today: '最終テストを実施',
      issues: 'テスト項目が完了していない',
    };
    const reportData_feb02_2 = {
      reportId: 'rep_20250202_002',
      userId: 'user_004',
      submittedAt: new Date('2025-02-02T08:45:00Z'),
      yesterday: '改善施策の検討を継続',
      today: 'コード最適化を実装する',
      issues: '応答時間が基準値を超えている',
    };
    const reportData_feb02_3 = {
      reportId: 'rep_20250202_003',
      userId: 'user_005',
      submittedAt: new Date('2025-02-02T09:00:00Z'),
      yesterday: '脆弱性修正計画の策定',
      today: '修正コードの実装を開始',
      issues: '重大度Highの脆弱性が検出された',
    };
    const reportData_feb02_4 = {
      reportId: 'rep_20250202_004',
      userId: 'user_007',
      submittedAt: new Date('2025-02-02T09:15:00Z'),
      yesterday: 'インシデント調査完了',
      today: 'システム復旧作業',
      issues: 'ネットワーク遅延が継続中',
    };

    // 期間外の日報（集約対象外）
    const reportData_jan30 = {
      reportId: 'rep_20250130_001',
      userId: 'user_008',
      submittedAt: new Date('2025-01-30T09:00:00Z'),
      yesterday: '前日の作業',
      today: '本日の予定',
      issues: 'その他の課題',
    };
    const reportData_feb03 = {
      reportId: 'rep_20250203_001',
      userId: 'user_009',
      submittedAt: new Date('2025-02-03T09:00:00Z'),
      yesterday: '期間外の作業',
      today: '期間外の予定',
      issues: '期間外の課題',
    };

    // すべてのテストデータを集約データセットに含める（期間外も）
    const allReports = [
      reportData_jan30,
      reportData_jan31_1,
      reportData_jan31_2,
      reportData_jan31_3,
      reportData_jan31_4,
      reportData_jan31_5,
      reportData_feb01_1,
      reportData_feb01_2,
      reportData_feb01_3,
      reportData_feb02_1,
      reportData_feb02_2,
      reportData_feb02_3,
      reportData_feb02_4,
      reportData_feb03,
    ];

    // extractMonthlyReportData を呼び出す
    const result = extractMonthlyReportData(aggregationStartDate, aggregationEndDate, allReports);

    // 期待結果の検証

    // 1. 抽出された日報総数は12件（期間内のみ）
    expect(result.totalReportCount).toBe(12);

    // 2. 抽出された日報IDの一覧を確認
    const extractedReportIds = result.reportIds;
    expect(extractedReportIds).toContain('rep_20250131_001');
    expect(extractedReportIds).toContain('rep_20250131_002');
    expect(extractedReportIds).toContain('rep_20250131_003');
    expect(extractedReportIds).toContain('rep_20250131_004');
    expect(extractedReportIds).toContain('rep_20250131_005');
    expect(extractedReportIds).toContain('rep_20250201_001');
    expect(extractedReportIds).toContain('rep_20250201_002');
    expect(extractedReportIds).toContain('rep_20250201_003');
    expect(extractedReportIds).toContain('rep_20250202_001');
    expect(extractedReportIds).toContain('rep_20250202_002');
    expect(extractedReportIds).toContain('rep_20250202_003');
    expect(extractedReportIds).toContain('rep_20250202_004');

    // 3. 期間外の日報が含まれていないことを確認
    expect(extractedReportIds).not.toContain('rep_20250130_001');
    expect(extractedReportIds).not.toContain('rep_20250203_001');

    // 4. 抽出された日報の数が正確に12件
    expect(extractedReportIds.length).toBe(12);

    // 5. 各日報に必要なフィールドが完全に保持されていることを確認
    result.reportIds.forEach((reportId: string) => {
      const report = result.reports?.find((r: any) => r.reportId === reportId);
      if (report) {
        expect(report).toHaveProperty('userId');
        expect(report).toHaveProperty('submittedAt');
        expect(report).toHaveProperty('yesterday');
        expect(report).toHaveProperty('today');
        expect(report).toHaveProperty('issues');
        expect(typeof report.userId).toBe('string');
        expect(report.submittedAt instanceof Date).toBe(true);
        expect(typeof report.yesterday).toBe('string');
        expect(typeof report.today).toBe('string');
        expect(typeof report.issues).toBe('string');
      }
    });

    // 6. 抽出期間の開始日・終了日が正確に記録されていることを確認
    expect(result.extractionPeriodStart).toBe('2025-01-31T00:00:00Z');
    expect(result.extractionPeriodEnd).toBe('2025-02-02T23:59:59Z');
  });
});