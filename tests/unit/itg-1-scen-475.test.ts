import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題自動抽出・優先度判定機能', () => {
  // SCEN-475
  test('10名の日報からキーワード抽出時に出現頻度が正確に集計される', () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const requestUserId = 'manager-001';

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((reportText: string) => {
        const keywords: { [key: string]: number } = {};

        if (reportText.includes('データベース接続エラー')) {
          keywords['データベース接続エラー'] = (keywords['データベース接続エラー'] || 0) + 1;
        }
        if (reportText.includes('API呼び出し失敗')) {
          keywords['API呼び出し失敗'] = (keywords['API呼び出し失敗'] || 0) + 1;
        }
        if (reportText.includes('タイムアウト')) {
          keywords['タイムアウト'] = (keywords['タイムアウト'] || 0) + 1;
        }

        return keywords;
      }),
      assessImpactScore: jest.fn(() => 50),
      classifyIssueSeverity: jest.fn(() => 'medium'),
    };

    const reportTexts: string[] = [
      'ユーザー1日報：昨日はデータベース接続エラーの調査を行いました。今日もデータベース接続エラーの対応を続けます。抱えている課題：API呼び出し失敗',
      'ユーザー1日報：データベース接続エラーが再度発生しました。タイムアウトも確認されました。',
      'ユーザー1日報：データベース接続エラーの根本原因を特定しました。',
      'ユーザー2日報：データベース接続エラーのテストを実施中です。API呼び出し失敗も併せて調査します。',
      'ユーザー2日報：データベース接続エラーのパッチを適用しました。',
      'ユーザー2日報：データベース接続エラーの再現テストを完了しました。',
      'ユーザー3日報：昨日はデータベース接続エラーで障害が発生しました。タイムアウトが原因の可能性があります。',
      'ユーザー3日報：データベース接続エラーの監視ツールを設定しました。',
      'ユーザー3日報：データベース接続エラーのアラート機能を追加しました。',
      'ユーザー4日報：データベース接続エラーのドキュメントを作成しました。',
      'ユーザー4日報：API呼び出し失敗とデータベース接続エラーを同時に解析しました。',
      'ユーザー4日報：データベース接続エラーの解決方法を共有しました。',
      'ユーザー5日報：本日はデータベース接続エラーの改善案を提案しました。',
      'ユーザー5日報：データベース接続エラーの影響範囲を調査しました。',
      'ユーザー5日報：データベース接続エラーへの対応ガイドを更新しました。',
      'ユーザー6日報：昨日はタイムアウトの問題が発生しました。データベース接続エラーも並行して発生していました。',
      'ユーザー6日報：データベース接続エラーの一時的な回避策を実装しました。',
      'ユーザー7日報：データベース接続エラーのサーバーログを分析しました。',
      'ユーザー7日報：データベース接続エラーの通知機能を強化しました。',
      'ユーザー8日報：昨日はAPI呼び出し失敗が多発しました。データベース接続エラーが関連していました。',
      'ユーザー8日報：データベース接続エラーのネットワーク診断を実施しました。',
      'ユーザー9日報：データベース接続エラーの自動リトライ機能を実装しました。',
      'ユーザー9日報：データベース接続エラーのテストカバレッジを向上させました。',
      'ユーザー10日報：データベース接続エラーが解決しました。',
      'ユーザー10日報：タイムアウトとデータベース接続エラーの関係を文書化しました。',
    ];

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(
      input,
      reportTexts,
      mockTextAnalysisAdapter
    );

    const databaseKeyword = result.keywords.find(
      (k) => k.keyword === 'データベース接続エラー'
    );
    expect(databaseKeyword).toBeDefined();
    expect(databaseKeyword?.frequency).toBe(25);
    expect(databaseKeyword?.rank).toBe(1);

    const apiKeyword = result.keywords.find(
      (k) => k.keyword === 'API呼び出し失敗'
    );
    expect(apiKeyword).toBeDefined();
    expect(apiKeyword?.frequency).toBe(4);

    const timeoutKeyword = result.keywords.find(
      (k) => k.keyword === 'タイムアウト'
    );
    expect(timeoutKeyword).toBeDefined();
    expect(timeoutKeyword?.frequency).toBe(4);

    expect(result.totalKeywordCount).toBe(3);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.keywords).toHaveLength(3);
    expect(result.keywords[0].keyword).toBe('データベース接続エラー');
  });
});