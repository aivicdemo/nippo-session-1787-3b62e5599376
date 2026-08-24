import { describe, test, expect } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import type { MonthlyReportDataset } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告集約分析機能 - 月をまたぐ期間の日報抽出', () => {
  // SCEN-2376
  test('集約期間が月をまたぐとき、月初から月末までのすべての日報を正確に抽出する', () => {
    // 入力パラメータ: 2025年1月28日 00:00:00 から 2025年2月3日 23:59:59
    const targetYear = 2025;
    const targetMonth = 2; // 集約対象は2月ですが、開始日が1月なため月境界テスト
    const requestedByUserId = 'user-manager-001';
    const teamIdFilter = undefined; // 全チーム対象

    // テスト用日報データセット: 1月28日〜2月3日、各日5件、計35件
    const mockReportRecords = [
      // 1月28日のデータ（5件）
      {
        reportId: 'report-20250128-001',
        userId: 'user-A',
        teamId: 'team-01',
        submittedAt: new Date('2025-01-28T09:00:00Z'),
        yesterday: '昨日は機能A開発を完了した',
        today: '今日は機能B開発を開始する',
        issues: '課題：DBコネクション接続エラー',
      },
      {
        reportId: 'report-20250128-002',
        userId: 'user-B',
        teamId: 'team-01',
        submittedAt: new Date('2025-01-28T09:15:00Z'),
        yesterday: 'テスト実施',
        today: 'テスト結果レビュー',
        issues: '課題：テスト環境のメモリ不足',
      },
      {
        reportId: 'report-20250128-003',
        userId: 'user-C',
        teamId: 'team-02',
        submittedAt: new Date('2025-01-28T09:30:00Z'),
        yesterday: 'UI改善',
        today: 'レイアウト調整',
        issues: '課題：ブラウザ互換性問題',
      },
      {
        reportId: 'report-20250128-004',
        userId: 'user-D',
        teamId: 'team-02',
        submittedAt: new Date('2025-01-28T09:45:00Z'),
        yesterday: 'ドキュメント作成',
        today: 'レビュー対応',
        issues: '課題：API仕様変更に追従',
      },
      {
        reportId: 'report-20250128-005',
        userId: 'user-E',
        teamId: 'team-03',
        submittedAt: new Date('2025-01-28T10:00:00Z'),
        yesterday: 'インフラ構築',
        today: 'セキュリティ設定',
        issues: '課題：SSL証明書期限切れ対応',
      },
      // 1月29日のデータ（5件）
      {
        reportId: 'report-20250129-001',
        userId: 'user-A',
        teamId: 'team-01',
        submittedAt: new Date('2025-01-29T09:00:00Z'),
        yesterday: '機能B開発中',
        today: 'ユニットテスト作成',
        issues: '課題：テストカバレッジ不足',
      },
      {
        reportId: 'report-20250129-002',
        userId: 'user-B',
        teamId: 'team-01',
        submittedAt: new Date('2025-01-29T09:15:00Z'),
        yesterday: 'テスト結果レビュー完了',
        today: 'バグ修正',
        issues: '課題：リグレッション発生',
      },
      {
        reportId: 'report-20250129-003',
        userId: 'user-C',
        teamId: 'team-02',
        submittedAt: new Date('2025-01-29T09:30:00Z'),
        yesterday: 'レイアウト調整完了',
        today: 'ダークモード実装',
        issues: '課題：デザイン仕様の曖昧性',
      },
      {
        reportId: 'report-20250129-004',
        userId: 'user-D',
        teamId: 'team-02',
        submittedAt: new Date('2025-01-29T09:45:00Z'),
        yesterday: 'レビュー対応完了',
        today: 'API仕様ドキュメント作成',
        issues: '課題：レスポンスタイム遅延',
      },
      {
        reportId: 'report-20250129-005',
        userId: 'user-E',
        teamId: 'team-03',
        submittedAt: new Date('2025-01-29T10:00:00Z'),
        yesterday: 'セキュリティ設定完了',
        today: 'ログ監視ツール導入',
        issues: '課題：ログストレージ容量不足',
      },
      // 1月30日のデータ（5件）
      {
        reportId: 'report-20250130-001',
        userId: 'user-A',
        teamId: 'team-01',
        submittedAt: new Date('2025-01-30T09:00:00Z'),
        yesterday: 'ユニットテスト作成完了',
        today: '統合テスト',
        issues: '課題：モックデータ不足',
      },
      {
        reportId: 'report-20250130-002',
        userId: 'user-B',
        teamId: 'team-01',
        submittedAt: new Date('2025-01-30T09:15:00Z'),
        yesterday: 'バグ修正完了',
        today: 'パフォーマンス最適化',
        issues: '課題：メモリリーク疑いあり',
      },
      {
        reportId: 'report-20250130-003',
        userId: 'user-C',
        teamId: 'team-02',
        submittedAt: new Date('2025-01-30T09:30:00Z'),
        yesterday: 'ダークモード実装中',
        today: 'ユーザーテスト',
        issues: '課題：色選択の一貫性',
      },
      {
        reportId: 'report-20250130-004',
        userId: 'user-D',
        teamId: 'team-02',
        submittedAt: new Date('2025-01-30T09:45:00Z'),
        yesterday: 'API仕様ドキュメント完成',
        today: 'エンドポイント実装',
        issues: '課題：バージョニング戦略検討中',
      },
      {
        reportId: 'report-20250130-005',
        userId: 'user-E',
        teamId: 'team-03',
        submittedAt: new Date('2025-01-30T10:00:00Z'),
        yesterday: 'ログ監視ツール導入完了',
        today: 'アラート設定',
        issues: '課題：通知先メール未設定',
      },
      // 1月31日のデータ（5件）- 月末日
      {
        reportId: 'report-20250131-001',
        userId: 'user-A',
        teamId: 'team-01',
        submittedAt: new Date('2025-01-31T09:00:00Z'),
        yesterday: '統合テスト実施',
        today: 'リリース準備',
        issues: '課題：デプロイメント手順書未完成',
      },
      {
        reportId: 'report-20250131-002',
        userId: 'user-B',
        teamId: 'team-01',
        submittedAt: new Date('2025-01-31T09:15:00Z'),
        yesterday: 'パフォーマンス最適化完了',
        today: 'ステージング環境テスト',
        issues: '課題：ステージング環境不安定',
      },
      {
        reportId: 'report-20250131-003',
        userId: 'user-C',
        teamId: 'team-02',
        submittedAt: new Date('2025-01-31T09:30:00Z'),
        yesterday: 'ユーザーテスト実施',
        today: 'フィードバック反映',
        issues: '課題：ユーザー要望対応時間短縮',
      },
      {
        reportId: 'report-20250131-004',
        userId: 'user-D',
        teamId: 'team-02',
        submittedAt: new Date('2025-01-31T09:45:00Z'),
        yesterday: 'エンドポイント実装進行中',
        today: 'テスト調整',
        issues: '課題：エラーレスポンス仕様未定',
      },
      {
        reportId: 'report-20250131-005',
        userId: 'user-E',
        teamId: 'team-03',
        submittedAt: new Date('2025-01-31T10:00:00Z'),
        yesterday: 'アラート設定完了',
        today: '月次レビュー',
        issues: '課題：月次レポート自動化未実装',
      },
      // 2月1日のデータ（5件）- 月初日（月境界）
      {
        reportId: 'report-20250201-001',
        userId: 'user-A',
        teamId: 'team-01',
        submittedAt: new Date('2025-02-01T09:00:00Z'),
        yesterday: 'リリース準備完了',
        today: 'プロダクション環境デプロイ',
        issues: '課題：本番デプロイの承認取得',
      },
      {
        reportId: 'report-20250201-002',
        userId: 'user-B',
        teamId: 'team-01',
        submittedAt: new Date('2025-02-01T09:15:00Z'),
        yesterday: 'ステージング環境テスト完了',
        today: 'デプロイ実施',
        issues: '課題：ロールバック手順検証',
      },
      {
        reportId: 'report-20250201-003',
        userId: 'user-C',
        teamId: 'team-02',
        submittedAt: new Date('2025-02-01T09:30:00Z'),
        yesterday: 'フィードバック反映完了',
        today: '新機能開発開始',
        issues: '課題：スコープ定義の曖昧性',
      },
      {
        reportId: 'report-20250201-004',
        userId: 'user-D',
        teamId: 'team-02',
        submittedAt: new Date('2025-02-01T09:45:00Z'),
        yesterday: 'テスト調整完了',
        today: 'パフォーマンステスト',
        issues: '課題：ロードテスト環境設定',
      },
      {
        reportId: 'report-20250201-005',
        userId: 'user-E',
        teamId: 'team-03',
        submittedAt: new Date('2025-02-01T10:00:00Z'),
        yesterday: '月次レビュー完了',
        today: '2月目標設定',
        issues: '課題：KPI達成状況不透明',
      },
      // 2月2日のデータ（5件）
      {
        reportId: 'report-20250202-001',
        userId: 'user-A',
        teamId: 'team-01',
        submittedAt: new Date('2025-02-02T09:00:00Z'),
        yesterday: 'プロダクション環境デプロイ完了',
        today: 'ホットフィックス対応',
        issues: '課題：本番環境バグ検出',
      },
      {
        reportId: 'report-20250202-002',
        userId: 'user-B',
        teamId: 'team-01',
        submittedAt: new Date('2025-02-02T09:15:00Z'),
        yesterday: 'デプロイ実施完了',
        today: '本番監視',
        issues: '課題：エラーログが多発',
      },
      {
        reportId: 'report-20250202-003',
        userId: 'user-C',
        teamId: 'team-02',
        submittedAt: new Date('2025-02-02T09:30:00Z'),
        yesterday: '新機能開発進行中',
        today: 'プロトタイピング',
        issues: '課題：技術スタック検討中',
      },
      {
        reportId: 'report-20250202-004',
        userId: 'user-D',
        teamId: 'team-02',
        submittedAt: new Date('2025-02-02T09:45:00Z'),
        yesterday: 'パフォーマンステスト実施',
        today: '結果分析',
        issues: '課題：ボトルネック特定困難',
      },
      {
        reportId: 'report-20250202-005',
        userId: 'user-E',
        teamId: 'team-03',
        submittedAt: new Date('2025-02-02T10:00:00Z'),
        yesterday: '2月目標設定完了',
        today: 'チーム内共有',
        issues: '課題：達成難度の見積もり',
      },
      // 2月3日のデータ（5件）
      {
        reportId: 'report-20250203-001',
        userId: 'user-A',
        teamId: 'team-01',
        submittedAt: new Date('2025-02-03T09:00:00Z'),
        yesterday: 'ホットフィックス対応完了',
        today: 'リリースノート作成',
        issues: '課題：変更内容の文書化不足',
      },
      {
        reportId: 'report-20250203-002',
        userId: 'user-B',
        teamId: 'team-01',
        submittedAt: new Date('2025-02-03T09:15:00Z'),
        yesterday: '本番監視継続',
        today: 'パフォーマンス改善',
        issues: '課題：改善効果測定方法未定',
      },
      {
        reportId: 'report-20250203-003',
        userId: 'user-C',
        teamId: 'team-02',
        submittedAt: new Date('2025-02-03T09:30:00Z'),
        yesterday: 'プロトタイピング実施',
        today: 'マークアップ開始',
        issues: '課題：CMS統合の検討',
      },
      {
        reportId: 'report-20250203-004',
        userId: 'user-D',
        teamId: 'team-02',
        submittedAt: new Date('2025-02-03T09:45:00Z'),
        yesterday: '結果分析完了',
        today: '改善提案書作成',
        issues: '課題：改善施策の優先順位付け',
      },
      {
        reportId: 'report-20250203-005',
        userId: 'user-E',
        teamId: 'team-03',
        submittedAt: new Date('2025-02-03T10:00:00Z'),
        yesterday: 'チーム内共有完了',
        today: 'リスク管理計画',
        issues: '課題：リスク対応者の割り当て',
      },
    ];

    // TextAnalysisServiceAdapter のモック
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => ({
        keywords: [
          { keyword: 'DBコネクション', frequency: 2 },
          { keyword: 'エラー', frequency: 3 },
        ],
        confidence: 0.85,
      })),
      assessImpactScore: jest.fn((keyword: string) => {
        const scoreMap: Record<string, number> = {
          'DBコネクション': 75,
          'テスト環境': 60,
          'ブラウザ互換性': 55,
          'エラー': 70,
          'メモリ': 65,
        };
        return scoreMap[keyword] || 50;
      }),
      classifyIssueSeverity: jest.fn((text: string) => {
        if (text.includes('本番') || text.includes('デプロイ')) {
          return 'high';
        }
        if (text.includes('環境') || text.includes('設定')) {
          return 'medium';
        }
        return 'low';
      }),
    };

    // 関数実行
    const result: MonthlyReportDataset = extractMonthlyReportData(
      {
        targetYear,
        targetMonth,
        requestedByUserId,
        teamIdFilter,
      },
      mockReportRecords,
      mockTextAnalysisAdapter
    );

    // 期待値の計算
    const expectedStart = new Date('2025-01-28T00:00:00Z').toISOString();
    const expectedEnd = new Date('2025-02-03T23:59:59Z').toISOString();
    const expectedTotalCount = 35;
    const expectedByTeam = [
      { teamId: 'team-01', count: 14 }, // 7日 × 2ユーザー
      { teamId: 'team-02', count: 14 }, // 7日 × 2ユーザー
      { teamId: 'team-03', count: 7 }, // 7日 × 1ユーザー
    ];

    // アサーション
    expect(result.extractionPeriodStart).toBe(expectedStart);
    expect(result.extractionPeriodEnd).toBe(expectedEnd);
    expect(result.totalReportCount).toBe(expectedTotalCount);

    // チーム別集計の検証
    expect(result.reportsByTeam).toHaveLength(3);

    const team01 = result.reportsByTeam.find(t => t.teamId === 'team-01');
    expect(team01).toBeDefined();
    expect(team01?.reportCount).toBe(14);
    expect(team01?.reportIds).toHaveLength(14);
    expect(team01?.submissionRate).toBeGreaterThan(0);

    const team02 = result.reportsByTeam.find(t => t.teamId === 'team-02');
    expect(team02).toBeDefined();
    expect(team02?.reportCount).toBe(14);
    expect(team02?.reportIds).toHaveLength(14);

    const team03 = result.reportsByTeam.find(t => t.teamId === 'team-03');
    expect(team03).toBeDefined();
    expect(team03?.reportCount).toBe(7);
    expect(team03?.reportIds).toHaveLength(7);

    // 月境界の日報が含まれることを確認
    const reportIds01 = team01?.reportIds || [];
    const reportIds02 = team02?.reportIds || [];
    const reportIds03 = team03?.reportIds || [];

    const jan31ReportIds = [
      'report-20250131-001',
      'report-20250131-002',
      'report-20250131-003',
      'report-20250131-004',
      'report-20250131-005',
    ];
    const feb01ReportIds = [
      'report-20250201-001',
      'report-20250201-002',
      'report-20250201-003',
      'report-20250201-004',
      'report-20250201-005',
    ];

    jan31ReportIds.forEach(id => {
      const isIncluded =
        reportIds01.includes(id) ||
        reportIds02.includes(id) ||
        reportIds03.includes(id);
      expect(isIncluded).toBe(true);
    });

    feb01ReportIds.forEach(id => {
      const isIncluded =
        reportIds01.includes(id) ||
        reportIds02.includes(id) ||
        reportIds03.includes(id);
      expect(isIncluded).toBe(true);
    });

    // データ品質スコアが正当な範囲内
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // 抽出実行日時が正当な日時形式
    const extractedAtDate = new Date(result.extractedAt);
    expect(extractedAtDate.getTime()).toBeGreaterThan(0);
  });
});