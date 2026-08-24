import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest, type WeeklyReportDataset } from '../../src/logic/weekly-issue-analysis';

describe('前週日報データ集約・課題抽出機能', () => {
  // SCEN-1476: 集約対象期間が月末月初をまたぐ場合（1月28日～2月3日）、両月のデータが正しく集約される
  test('should correctly aggregate and extract reports spanning January 28 to February 3, covering both months without duplication or gaps', () => {
    // テストデータ準備：1月28日～1月31日の日報データ（5ユーザー×4日=20件）
    const januaryReports = [
      {
        reportDate: new Date('2024-01-28T09:00:00Z'),
        userId: 'user001',
        yesterday: '仕様書レビュー完了',
        today: '実装開始',
        challenges: 'データベース接続タイムアウトの課題',
      },
      {
        reportDate: new Date('2024-01-28T09:05:00Z'),
        userId: 'user002',
        yesterday: 'テストケース作成',
        today: '単体テスト実施',
        challenges: 'テストデータ準備の遅延',
      },
      {
        reportDate: new Date('2024-01-28T09:10:00Z'),
        userId: 'user003',
        yesterday: 'ドキュメント更新',
        today: 'API仕様書確認',
        challenges: 'API仕様の曖昧さ',
      },
      {
        reportDate: new Date('2024-01-28T09:15:00Z'),
        userId: 'user004',
        yesterday: 'バグ修正',
        today: 'リグレッションテスト',
        challenges: 'リグレッションテストの遅延',
      },
      {
        reportDate: new Date('2024-01-28T09:20:00Z'),
        userId: 'user005',
        yesterday: 'デプロイ準備',
        today: 'ステージング環境確認',
        challenges: '環境構築の問題',
      },
      {
        reportDate: new Date('2024-01-29T09:00:00Z'),
        userId: 'user001',
        yesterday: '実装第1段階',
        today: '実装第2段階',
        challenges: 'パフォーマンス問題',
      },
      {
        reportDate: new Date('2024-01-29T09:05:00Z'),
        userId: 'user002',
        yesterday: '単体テスト実施',
        today: '統合テスト開始',
        challenges: 'テストデータの不整合',
      },
      {
        reportDate: new Date('2024-01-29T09:10:00Z'),
        userId: 'user003',
        yesterday: 'API仕様書確認',
        today: 'API実装検討',
        challenges: 'API仕様の曖昧さ',
      },
      {
        reportDate: new Date('2024-01-29T09:15:00Z'),
        userId: 'user004',
        yesterday: 'リグレッションテスト',
        today: 'パフォーマンステスト',
        challenges: 'テスト環境のリソース不足',
      },
      {
        reportDate: new Date('2024-01-29T09:20:00Z'),
        userId: 'user005',
        yesterday: 'ステージング環境確認',
        today: 'インテグレーション検証',
        challenges: 'インテグレーション検証の複雑性',
      },
      {
        reportDate: new Date('2024-01-30T09:00:00Z'),
        userId: 'user001',
        yesterday: '実装第2段階',
        today: 'コードレビュー対応',
        challenges: 'レビュー指摘の多さ',
      },
      {
        reportDate: new Date('2024-01-30T09:05:00Z'),
        userId: 'user002',
        yesterday: '統合テスト開始',
        today: '統合テスト進行',
        challenges: 'テスト進捗の遅延',
      },
      {
        reportDate: new Date('2024-01-30T09:10:00Z'),
        userId: 'user003',
        yesterday: 'API実装検討',
        today: 'API実装着手',
        challenges: 'API実装の複雑性',
      },
      {
        reportDate: new Date('2024-01-30T09:15:00Z'),
        userId: 'user004',
        yesterday: 'パフォーマンステスト',
        today: 'パフォーマンス改善検討',
        challenges: 'パフォーマンス改善の難度',
      },
      {
        reportDate: new Date('2024-01-30T09:20:00Z'),
        userId: 'user005',
        yesterday: 'インテグレーション検証',
        today: 'バグ修正',
        challenges: 'バグの深刻度',
      },
      {
        reportDate: new Date('2024-01-31T09:00:00Z'),
        userId: 'user001',
        yesterday: 'コードレビュー対応',
        today: 'ビルド準備',
        challenges: 'ビルド成功率の問題',
      },
      {
        reportDate: new Date('2024-01-31T09:05:00Z'),
        userId: 'user002',
        yesterday: '統合テスト進行',
        today: '問題分析と対応',
        challenges: '問題分析の時間不足',
      },
      {
        reportDate: new Date('2024-01-31T09:10:00Z'),
        userId: 'user003',
        yesterday: 'API実装着手',
        today: 'API実装進行',
        challenges: 'API実装進度の遅延',
      },
      {
        reportDate: new Date('2024-01-31T09:15:00Z'),
        userId: 'user004',
        yesterday: 'パフォーマンス改善検討',
        today: 'パフォーマンス最適化実施',
        challenges: '最適化による副作用',
      },
      {
        reportDate: new Date('2024-01-31T09:20:00Z'),
        userId: 'user005',
        yesterday: 'バグ修正',
        today: 'リリース前最終確認',
        challenges: 'リリース前の懸念事項',
      },
    ];

    // テストデータ準備：2月1日～2月3日の日報データ（5ユーザー×3日=15件）
    const februaryReports = [
      {
        reportDate: new Date('2024-02-01T09:00:00Z'),
        userId: 'user001',
        yesterday: 'ビルド準備',
        today: 'ビルド実行',
        challenges: 'ビルドエラーの対応',
      },
      {
        reportDate: new Date('2024-02-01T09:05:00Z'),
        userId: 'user002',
        yesterday: '問題分析と対応',
        today: 'テスト再実行',
        challenges: 'テスト結果の解釈',
      },
      {
        reportDate: new Date('2024-02-01T09:10:00Z'),
        userId: 'user003',
        yesterday: 'API実装進行',
        today: 'API仕様の曖昧さ対応',
        challenges: '仕様の不備による遅延',
      },
      {
        reportDate: new Date('2024-02-01T09:15:00Z'),
        userId: 'user004',
        yesterday: 'パフォーマンス最適化実施',
        today: '最適化結果の検証',
        challenges: '検証結果の不安定性',
      },
      {
        reportDate: new Date('2024-02-01T09:20:00Z'),
        userId: 'user005',
        yesterday: 'リリース前最終確認',
        today: 'リリース実行',
        challenges: 'リリース実行時の懸念',
      },
      {
        reportDate: new Date('2024-02-02T09:00:00Z'),
        userId: 'user001',
        yesterday: 'ビルド実行',
        today: 'リリース後対応',
        challenges: 'リリース後の問題対応',
      },
      {
        reportDate: new Date('2024-02-02T09:05:00Z'),
        userId: 'user002',
        yesterday: 'テスト再実行',
        today: '本番環境確認',
        challenges: '本番環境での動作確認',
      },
      {
        reportDate: new Date('2024-02-02T09:10:00Z'),
        userId: 'user003',
        yesterday: 'API仕様の曖昧さ対応',
        today: 'API仕様確定',
        challenges: 'API仕様確定の遅延',
      },
      {
        reportDate: new Date('2024-02-02T09:15:00Z'),
        userId: 'user004',
        yesterday: '最適化結果の検証',
        today: '最適化完了',
        challenges: '最適化完了の確認',
      },
      {
        reportDate: new Date('2024-02-02T09:20:00Z'),
        userId: 'user005',
        yesterday: 'リリース実行',
        today: 'リリース後の監視',
        challenges: 'リリース後の障害検知',
      },
      {
        reportDate: new Date('2024-02-03T09:00:00Z'),
        userId: 'user001',
        yesterday: 'リリース後対応',
        today: '障害対応',
        challenges: '障害対応の複雑性',
      },
      {
        reportDate: new Date('2024-02-03T09:05:00Z'),
        userId: 'user002',
        yesterday: '本番環境確認',
        today: '本番環境監視',
        challenges: '本番環境監視の継続',
      },
      {
        reportDate: new Date('2024-02-03T09:10:00Z'),
        userId: 'user003',
        yesterday: 'API仕様確定',
        today: 'API周辺機能実装',
        challenges: 'API周辺機能の複雑性',
      },
      {
        reportDate: new Date('2024-02-03T09:15:00Z'),
        userId: 'user004',
        yesterday: '最適化完了',
        today: '最適化ドキュメント作成',
        challenges: 'ドキュメント作成の時間不足',
      },
      {
        reportDate: new Date('2024-02-03T09:20:00Z'),
        userId: 'user005',
        yesterday: 'リリース後の監視',
        today: '次リリース準備',
        challenges: '次リリース準備の計画策定',
      },
    ];

    // 統合テストデータ
    const allReports = [...januaryReports, ...februaryReports];

    // リクエストペイロード作成
    const extractionRequest: WeeklyExtractionRequest = {
      weekStartDate: new Date('2024-01-28T00:00:00Z'),
      weekEndDate: new Date('2024-02-03T23:59:59Z'),
      teamIds: ['team001'],
      requestedByUserId: 'manager001',
    };

    // 関数呼び出し（実装がデータを内部で取得するか、または事前にモック化されている想定）
    // ここではextractWeeklyReportDataが返すWeeklyReportDatasetの構造を検証する
    const result: WeeklyReportDataset = extractWeeklyReportData(
      allReports,
      extractionRequest,
    );

    // 検証1: weekRangeが正しく設定されている
    expect(result.weekRange.startDate).toEqual(new Date('2024-01-28T00:00:00Z'));
    expect(result.weekRange.endDate).toEqual(new Date('2024-02-03T23:59:59Z'));

    // 検証2: 総報告件数が正しい（1月20件+2月15件=35件）
    expect(result.totalReportsExtracted).toBe(35);

    // 検証3: reportsByDateの構造と件数を検証
    // 1月28日～1月31日（4日）と2月1日～2月3日（3日）＝7日分
    expect(result.reportsByDate.length).toBe(7);

    // 検証4: 1月28日のデータを確認
    const jan28Report = result.reportsByDate.find(
      r => r.reportDate.toISOString().startsWith('2024-01-28'),
    );
    expect(jan28Report).toBeDefined();
    expect(jan28Report!.reportCount).toBe(5); // 5ユーザー
    expect(jan28Report!.submittedByUserIds.length).toBe(5);
    expect(jan28Report!.submittedByUserIds).toContain('user001');
    expect(jan28Report!.submittedByUserIds).toContain('user005');

    // 検証5: 1月分データの集計（1月28日～1月31日の4日間）
    const januaryDates = result.reportsByDate.filter(
      r =>
        r.reportDate.toISOString().startsWith('2024-01-28') ||
        r.reportDate.toISOString().startsWith('2024-01-29') ||
        r.reportDate.toISOString().startsWith('2024-01-30') ||
        r.reportDate.toISOString().startsWith('2024-01-31'),
    );
    expect(januaryDates.length).toBe(4);
    const januaryTotalReports = januaryDates.reduce(
      (sum, day) => sum + day.reportCount,
      0,
    );
    expect(januaryTotalReports).toBe(20); // 5ユーザー×4日

    // 検証6: 2月分データの集計（2月1日～2月3日の3日間）
    const februaryDates = result.reportsByDate.filter(
      r =>
        r.reportDate.toISOString().startsWith('2024-02-01') ||
        r.reportDate.toISOString().startsWith('2024-02-02') ||
        r.reportDate.toISOString().startsWith('2024-02-03'),
    );
    expect(februaryDates.length).toBe(3);
    const februaryTotalReports = februaryDates.reduce(
      (sum, day) => sum + day.reportCount,
      0,
    );
    expect(februaryTotalReports).toBe(15); // 5ユーザー×3日

    // 検証7: 課題キーワードが正しく抽出されている
    expect(result.extractedChallenges.length).toBeGreaterThan(0);

    // 検証8: 課題キーワードの重複排除を確認（同じキーワードが複数報告されても1回にカウント）
    const challengeKeywords = result.extractedChallenges.map(
      c => c.keyword,
    );
    const uniqueKeywords = new Set(challengeKeywords);
    expect(uniqueKeywords.size).toBe(challengeKeywords.length);

    // 検証9: extractedChallengesに期待されるキーワードが含まれている
    const keywordStrings = result.extractedChallenges.map(c => c.keyword);
    expect(keywordStrings).toContain('データベース接続タイムアウト');
    expect(keywordStrings).toContain('テストデータ準備の遅延');
    expect(keywordStrings).toContain('API仕様の曖昧さ');

    // 検証10: 課題の発生頻度がカウントされている
    const apiSpecIssuance = result.extractedChallenges.find(
      c => c.keyword === 'API仕様の曖昧さ',
    );
    if (apiSpecIssuance) {
      // このキーワードは1月29日、1月30日、2月1日、2月3日に報告されている（複数ユーザー）
      expect(apiSpecIssuance.occurrenceCount).toBeGreaterThan(0);
    }

    // 検証11: データ品質スコアが計算されている
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // 検証12: 各DailyReportSummaryに課題項目のテキストが含まれている
    result.reportsByDate.forEach(dailySummary => {
      expect(Array.isArray(dailySummary.challengeItems)).toBe(true);
      expect(dailySummary.challengeItems.length).toBeGreaterThan(0);
    });

    // 検証13: 月をまたぐデータの連続性を確認（2月1日のデータが正しく区分されている）
    const feb01Report = result.reportsByDate.find(
      r => r.reportDate.toISOString().startsWith('2024-02-01'),
    );
    expect(feb01Report).toBeDefined();
    expect(feb01Report!.reportCount).toBe(5); // 2月1日も5ユーザー分

    // 検証14: 期間全体のレポート件数が重複なく加算されている
    const totalReportsByDate = result.reportsByDate.reduce(
      (sum, day) => sum + day.reportCount,
      0,
    );
    expect(totalReportsByDate).toBe(35);

    // 検証15: タイムスタンプが期間内に収まっている
    result.reportsByDate.forEach(dailySummary => {
      expect(dailySummary.reportDate.getTime()).toBeGreaterThanOrEqual(
        new Date('2024-01-28T00:00:00Z').getTime(),
      );
      expect(dailySummary.reportDate.getTime()).toBeLessThanOrEqual(
        new Date('2024-02-03T23:59:59Z').getTime(),
      );
    });
  });
});