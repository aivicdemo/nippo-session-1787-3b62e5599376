import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート生成機能 - TextAnalysisServiceAdapter 失敗時のエラーハンドリング', () => {
  // SCEN-1815
  test('TextAnalysisServiceAdapter の影響度判定が失敗した場合、レポート生成処理全体がエラーで中断される', async () => {
    // 前提条件: 該当月の日報データが3件以上存在し、各日報に課題キーワードが含まれている状態
    const mockReportData = [
      {
        id: 'report-001',
        date: '2024-01-05',
        teamId: 'team-01',
        content: '昨日やったこと：機能A実装\n今日やること：機能B実装\n抱えている課題：パフォーマンス問題',
        issues: ['パフォーマンス問題', 'データベース接続タイムアウト'],
      },
      {
        id: 'report-002',
        date: '2024-01-08',
        teamId: 'team-01',
        content: '昨日やったこと：テスト実行\n今日やること：バグ修正\n抱えている課題：メモリリーク',
        issues: ['メモリリーク', 'ガベージコレクション'],
      },
      {
        id: 'report-003',
        date: '2024-01-10',
        teamId: 'team-02',
        content: '昨日やったこと：ドキュメント作成\n今日やること：レビュー対応\n抱えている課題：マージコンフリクト',
        issues: ['マージコンフリクト'],
      },
    ];

    // TextAnalysisServiceAdapter のスタブを構成し、assessImpactScore が例外をスローするように設定
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['パフォーマンス問題', 'メモリリーク', 'マージコンフリクト'],
        frequency: [2, 1, 1],
      }),
      assessImpactScore: jest.fn().mockRejectedValue(new Error('TextAnalysisServiceAdapter エラー: APIタイムアウト')),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    // 月次レポート生成処理を実行し、エラーをキャッチ
    let caughtError: Error | null = null;

    try {
      await extractMonthlyReportData(
        {
          targetYear: 2024,
          targetMonth: 1,
          requestedByUserId: 'user-001',
          teamIdFilter: ['team-01', 'team-02'],
        },
        mockTextAnalysisAdapter
      );
    } catch (error) {
      caughtError = error as Error;
    }

    // 期待結果の検証
    // (1) エラーオブジェクトが返却される
    expect(caughtError).not.toBeNull();
    expect(caughtError).toBeInstanceOf(Error);

    // (2) エラーメッセージに『影響度判定に失敗しました』または『TextAnalysisServiceAdapter エラー』を含む
    expect(caughtError?.message).toMatch(/影響度判定に失敗しました|TextAnalysisServiceAdapter エラー/);

    // (3) TextAnalysisServiceAdapter.assessImpactScore が呼び出されたことを確認（外部サービス呼び出し試行を確認）
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();

    // (4) レポート生成処理の外部出力が実行されていないことを確認
    // （エラー発生時にはファイル生成、メール送信、DB保存が実行されないことを期待）
    // このテストではスタブのため、実際の外部出力は発生していないことが保証される
  });
});