import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Large-Scale Keyword Processing', () => {
  let startTime: number;
  let endTime: number;

  beforeEach(() => {
    startTime = Date.now();
  });

  afterEach(() => {
    endTime = Date.now();
  });

  // SCEN-1507
  test('should extract and rank hundreds of keywords from 500 daily reports with 3000-5000 total occurrences within 30 seconds', async () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn(async () => {
        const largeKeywordDataset = generateLargeKeywordDataset();
        return largeKeywordDataset;
      }),
      assessImpactScore: jest.fn(async () => 75),
      classifyIssueSeverity: jest.fn(async () => 'medium'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisService
    );

    endTime = Date.now();
    const processingTimeMs = endTime - startTime;

    expect(processingTimeMs).toBeLessThan(30000);

    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    expect(result.keywords.length).toBeGreaterThanOrEqual(200);
    expect(result.keywords.length).toBeLessThanOrEqual(500);

    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(200);
    expect(result.totalKeywordCount).toBeLessThanOrEqual(500);

    result.keywords.forEach((keyword) => {
      expect(keyword.keywordId).toBeDefined();
      expect(typeof keyword.keywordId).toBe('string');
      expect(keyword.keyword).toBeDefined();
      expect(typeof keyword.keyword).toBe('string');
      expect(keyword.frequency).toBeDefined();
      expect(typeof keyword.frequency).toBe('number');
      expect(keyword.frequency).toBeGreaterThan(0);
      expect(keyword.rank).toBeDefined();
      expect(typeof keyword.rank).toBe('number');
      expect(keyword.rank).toBeGreaterThan(0);
    });

    for (let i = 0; i < result.keywords.length - 1; i++) {
      expect(result.keywords[i].rank).toBeLessThanOrEqual(result.keywords[i + 1].rank);
      expect(result.keywords[i].frequency).toBeGreaterThanOrEqual(result.keywords[i + 1].frequency);
    }

    const keywordSet = new Set(result.keywords.map((k) => k.keywordId));
    expect(keywordSet.size).toBe(result.keywords.length);

    const top20Keywords = result.keywords.slice(0, 20);
    top20Keywords.forEach((keyword, index) => {
      expect(keyword.rank).toBe(index + 1);
      expect(keyword.frequency).toBeGreaterThan(0);
    });

    expect(result.extractedAt).toBeDefined();
    expect(result.extractedAt instanceof Date).toBe(true);

    expect(result.analysisperiodDays).toBe(7);
  });

  function generateLargeKeywordDataset(): Array<{
    normalizedKeyword: string;
    originalKeywords: string[];
    mergedFrequency: number;
  }> {
    const keywords = [
      'データベース接続',
      'メモリリーク',
      'API レスポンス遅延',
      'ビルドエラー',
      'ユーザー認証',
      'ネットワークタイムアウト',
      'キャッシュ無効化',
      'ログ出力',
      'テスト失敗',
      'デプロイ遅延',
      'SQL クエリ最適化',
      'CSS スタイル崩れ',
      'JavaScript エラー',
      'フォーム検証',
      'セッション管理',
      'ファイルアップロード',
      'ページ読込速度',
      'エラーハンドリング',
      'リソースリーク',
      'スケーラビリティ',
      'データ永続化',
      'キー管理',
      'ドキュメンテーション不足',
      'コード レビュー',
      'バージョン競合',
      '依存関係解決',
      'テスト カバレッジ',
      'バグ回帰',
      'パフォーマンス低下',
      'セキュリティ脆弱性',
      'ユーザーインターフェース',
      'APIスキーマ変更',
      'データベース マイグレーション',
      '環境変数設定',
      'Docker イメージ',
      'Kubernetes デプロイ',
      'ログ分析',
      'メトリクス監視',
      'アラート設定',
      'ホットリロード',
      'キャッシュ戦略',
      'レート リミット',
      'エラー リトライ',
      'サーキットブレーカー',
      'トランザクション管理',
      'ロック競合',
      'デッドロック',
      '接続プール',
      'スレッド安全性',
      'メモリ効率',
      '圧縮率',
      'エンコーディング',
      'JWT トークン',
      'OAuth 統合',
      'HTTPS 証明書',
      'CORS 設定',
      'XSS 対策',
      'SQL インジェクション',
      'CSRF トークン',
      'レート制限',
      'IP ホワイトリスト',
      'WAF ルール',
      'ファイアウォール設定',
      'VPN 接続',
      'DNS 解決',
      'CDN キャッシュ',
      'ロードバランシング',
      'フェイルオーバー',
      'リージョン レプリケーション',
      'バックアップ復元',
      'ディザスタリカバリ',
      'RTO 設定',
      'RPO 設定',
      'コンプライアンス チェック',
      ' 監査ログ',
      'データ削除',
      '個人情報保護',
      'GDPR 対応',
      'データ分類',
      'アクセス制御',
      'ロールベース権限',
      '属性ベース制御',
      'シングルサインオン',
      'ミュー ファクタ認証',
      'バイオメトリクス認証',
      'チャレンジレスポンス',
      'パスキー登録',
      'デバイス信頼',
      'ジオロケーション検証',
      'リスク スコア算出',
      'アノマリ検知',
      'パターンマッチング',
      'テキスト解析',
      '感情分析',
      'エンティティ抽出',
      'トピック モデリング',
      '自然言語処理',
      'トークン化',
      'ステミング',
      'レンマ化',
      '形態素解析',
      '構文解析',
      'セマンティック検索',
      '埋め込み モデル',
      'ベクトル データベース',
      'シミラリティ スコア',
      'クラスタリング',
      'K-means アルゴリズム',
      '階層的クラスタリング',
      'DBスキャン',
      '教師あり学習',
      '教師なし学習',
      '強化学習',
      '転移学習',
      'ファインチューニング',
      'ハイパーパラメータ調整',
      'クロス バリデーション',
      'グリッド サーチ',
      'ランダム サーチ',
      'ベイズ最適化',
      '勾配ブースティング',
      'アンサンブル学習',
      'バギング',
      'スタッキング',
      'ブレンディング',
      'ボーティング',
      'メタモデル',
      'ベースモデル',
      'トレーニング セット',
      'テスト セット',
      '検証 セット',
      'オーバーフィッティング',
      'アンダーフィッティング',
      '正則化',
      'L1 ペナルティ',
      'L2 ペナルティ',
      'ドロップアウト',
      'バッチ正規化',
      'レイヤー正規化',
      'グループ正規化',
      'インスタンス正規化',
      'ウェイト初期化',
      '活性化関数',
      'ReLU 関数',
      'Sigmoid 関数',
      'Tanh 関数',
      'Softmax 関数',
      '勾配消失',
      '勾配爆発',
      'バックプロパゲーション',
      'フォワードパス',
      'バックワードパス',
      '損失関数',
      'クロスエントロピー',
      '平均二乗誤差',
      '平均絶対誤差',
      'Huber 損失',
      'トリプレット 損失',
      'コントラスティブ 損失',
      'オプティマイザ',
      'SGD 最適化',
      'Adam 最適化',
      'RMSprop 最適化',
      'Adagrad 最適化',
      'Adadelta 最適化',
      'Nadam 最適化',
      '学習率',
      'スケジューリング',
      'ウォームアップ',
      'コールドスタート',
      'ハイパーボリック スケジューリング',
      'ステップ スケジューリング',
      'サイクリック スケジューリング',
      'コサイン アニーリング',
      'One Cycle ポリシー',
      'EMA トラッキング',
      'ポリノミアル ディケイ',
      'エクスポーネンシャル ディケイ',
    ];

    const dataset: Array<{
      normalizedKeyword: string;
      originalKeywords: string[];
      mergedFrequency: number;
    }> = [];

    let frequencyCounter = 5000;
    for (let i = 0; i < keywords.length; i++) {
      const frequency = Math.max(
        1,
        Math.floor(frequencyCounter - i * 8 - Math.random() * 20)
      );
      dataset.push({
        normalizedKeyword: keywords[i],
        originalKeywords: [keywords[i]],
        mergedFrequency: frequency,
      });
    }

    return dataset.sort((a, b) => b.mergedFrequency - a.mergedFrequency);
  }
});