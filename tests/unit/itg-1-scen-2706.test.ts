import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { fetchYesterdayReport } from '../../src/logic/report-submission';
import crypto from 'crypto';

describe('fetchYesterdayReport - Large Report Text Handling', () => {
  // SCEN-2706: [edge] 前日報告内容の取得・表示機能 - 報告テキストが業務上の最大規模（例：数MB相当）のサイズを含む場合、全内容が正確に取得される

  let mockNotificationServiceAdapter: any;
  let mockTextAnalysisServiceAdapter: any;

  beforeEach(() => {
    // NotificationServiceAdapterをスタブ化
    mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ success: true, status: 'sent' }),
      scheduleNotification: jest.fn().mockResolvedValue({ success: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'delivered' }),
    };

    // TextAnalysisServiceAdapterをスタブ化
    mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({ keywords: [], frequency: [] }),
      assessImpactScore: jest.fn().mockResolvedValue({ score: 0 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'low' }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should retrieve large report text (approximately 5MB) with complete accuracy and verify hash, boundaries, and special characters', async () => {
    // テスト用の大規模報告テキストを生成（約150万文字 ≈ 5MB）
    const japaneseTextBase = '昨日は定例会議に参加しました。マイクロサービスアーキテクチャの設計について、チーム全体で議論を行い、スケーラビリティの向上に関する提案が承認されました。\n本日の予定としては、バックエンドAPIの実装を進めることです。具体的には、ユーザー認証機能の強化とキャッシング戦略の最適化に取り組みます。\n現在抱えている課題は、データベースクエリの応答時間が遅延していることです。特に大規模データセットの処理時に顕著です。また、チーム間の情報共有がまだ不十分で、重複した作業が発生しています。\n改善施策として、データベースインデックスの見直しと、チーム内のコミュニケーションプロトコルの統一化を推奨します。\n特殊文字テスト：!@#$%^&*()_+-=[]{}|;:,.<>?/~`\n絵文字テスト：😀😃😄😁🎉🎊🎈🎀🎁🎂🎃🎄🎆🎇✨🌟💫⭐🌠\n改行と空白をテストします。\n\n\nこれは複数の改行です。';
    
    // テキストを繰り返して約5MB相当に拡張（150万文字）
    const targetCharCount = 1500000;
    let largeReportText = '';
    while (largeReportText.length < targetCharCount) {
      largeReportText += japaneseTextBase + '\n';
    }
    largeReportText = largeReportText.substring(0, targetCharCount);

    // 元データのハッシュ値を計算（SHA-256）
    const originalHash = crypto.createHash('sha256').update(largeReportText, 'utf-8').digest('hex');

    // テスト用入力パラメータ
    const engineerId = 'engineer-test-001';
    const targetDate = new Date('2024-01-15');
    const requestingUserId = 'manager-test-001';

    // モック化したデータベースで前日報告を構築
    const mockDailyReport = {
      reportId: 'report-test-20240115-001',
      engineerId: engineerId,
      reportDate: targetDate,
      yesterdayAccomplishment: largeReportText.substring(0, Math.floor(largeReportText.length / 3)),
      todayPlan: largeReportText.substring(Math.floor(largeReportText.length / 3), Math.floor(2 * largeReportText.length / 3)),
      challenges: largeReportText.substring(Math.floor(2 * largeReportText.length / 3)),
      submittedAt: new Date('2024-01-14T17:30:00Z'),
    };

    // fetchYesterdayReportを呼び出し（タイムアウト監視）
    const startTime = Date.now();
    const result = await Promise.race([
      fetchYesterdayReport(
        { engineerId, targetDate, requestingUserId },
        mockNotificationServiceAdapter,
        mockTextAnalysisServiceAdapter
      ),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('fetchYesterdayReport timeout exceeded 30 seconds')),
          30000
        )
      ),
    ]);
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;

    // レスポンスが存在することを確認
    expect(result).toBeDefined();
    expect(result).toHaveProperty('reportId');
    expect(result).toHaveProperty('engineerId');
    expect(result).toHaveProperty('reportDate');
    expect(result).toHaveProperty('yesterdayAccomplishment');
    expect(result).toHaveProperty('todayPlan');
    expect(result).toHaveProperty('challenges');
    expect(result).toHaveProperty('submittedAt');

    // 取得したテキストのバイト数を検証
    const retrievedCombinedText = result.yesterdayAccomplishment + result.todayPlan + result.challenges;
    const retrievedByteLength = Buffer.byteLength(retrievedCombinedText, 'utf-8');
    expect(retrievedByteLength).toBeGreaterThan(4000000); // 少なくとも4MB以上

    // 取得したテキストのハッシュ値を計算
    const retrievedHash = crypto.createHash('sha256').update(retrievedCombinedText, 'utf-8').digest('hex');
    expect(retrievedHash).toBe(originalHash);

    // 先頭100文字を検証
    const originalFirst100 = largeReportText.substring(0, 100);
    const retrievedFirst100 = retrievedCombinedText.substring(0, 100);
    expect(retrievedFirst100).toBe(originalFirst100);

    // 末尾100文字を検証
    const originalLast100 = largeReportText.substring(largeReportText.length - 100);
    const retrievedLast100 = retrievedCombinedText.substring(retrievedCombinedText.length - 100);
    expect(retrievedLast100).toBe(originalLast100);

    // 改行・特殊文字・絵文字が保持されていることを確認
    expect(retrievedCombinedText).toContain('!@#$%^&*()_+-=[]{}|;:,.<>?/~`');
    expect(retrievedCombinedText).toContain('😀');
    expect(retrievedCombinedText).toContain('🎉');
    expect(retrievedCombinedText).toMatch(/\n\n\n/); // 複数の改行を確認

    // 30秒以内に返却されたことを確認
    expect(elapsedTime).toBeLessThan(30000);

    // 複数回（3回）同じ報告を取得し、毎回同じ内容が返却されることを確認
    for (let iteration = 1; iteration <= 3; iteration++) {
      const retryResult = await Promise.race([
        fetchYesterdayReport(
          { engineerId, targetDate, requestingUserId },
          mockNotificationServiceAdapter,
          mockTextAnalysisServiceAdapter
        ),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`fetchYesterdayReport timeout on iteration ${iteration}`)),
            30000
          )
        ),
      ]);

      const retryRetrievedText = retryResult.yesterdayAccomplishment + retryResult.todayPlan + retryResult.challenges;
      const retryHash = crypto.createHash('sha256').update(retryRetrievedText, 'utf-8').digest('hex');
      expect(retryHash).toBe(originalHash);
      expect(retryRetrievedText).toBe(retrievedCombinedText);
    }
  });
});