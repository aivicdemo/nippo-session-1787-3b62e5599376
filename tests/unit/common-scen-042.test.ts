import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { detectAndNotifyUnsubmitted } from '../../src/logic/submission-status-management';

describe('submission-status-management', () => {
  // SCEN-042: [normal] 日報収集から課題抽出・配信までの自律実行 AIエージェント
  // 「日報収集から課題抽出・配信までの自律実行」が自律処理「受信した日報を統一フォーマットに自動変換する」を契約どおり実行する
  test('should normalize multiple report formats to unified format and detect unsubmitted members', async () => {
    // Arrange: テスト用の入力データを準備
    const reportDate = '2024-01-15';
    const cutoffTime = new Date('2024-01-15T09:00:00Z');
    
    // 複数形式混在の日報データ: テキスト、JSON、CSV
    const rawReports = [
      {
        memberId: 'EMP001',
        memberName: '山田太郎',
        sourceFormat: 'TEXT',
        content: '昨日：バグ修正\n今日：機能開発\n課題：パフォーマンス低下'
      },
      {
        memberId: 'EMP002',
        memberName: '鈴木花子',
        sourceFormat: 'JSON',
        content: JSON.stringify({
          yesterday: 'テスト実施',
          today: 'ドキュメント作成',
          issues: ['納期遅延の可能性']
        })
      },
      {
        memberId: 'EMP003',
        memberName: '佐藤次郎',
        sourceFormat: 'CSV',
        content: 'yesterday,today,issue1,issue2\n要件定義,開発着手,リスク識別,コスト超過'
      },
      {
        memberId: 'EMP004',
        memberName: '高橋美咲',
        sourceFormat: 'TEXT',
        content: '昨日：コードレビュー\n今日：本番デプロイ\n課題：スケーラビリティ'
      },
      {
        memberId: 'EMP005',
        memberName: '田中健一',
        sourceFormat: 'JSON',
        content: JSON.stringify({
          yesterday: 'インフラ構築',
          today: 'ネットワーク設定',
          issues: ['セキュリティ脆弱性']
        })
      },
      {
        memberId: 'EMP006',
        memberName: '伊藤由美',
        sourceFormat: 'CSV',
        content: 'yesterday,today,issue\nDB最適化,バックアップ構築,データ整合性'
      },
      {
        memberId: 'EMP007',
        memberName: '中村孝夫',
        sourceFormat: 'TEXT',
        content: '昨日：会議参加\n今日：報告書作成\n課題：コミュニケーション'
      },
      {
        memberId: 'EMP008',
        memberName: '渡辺智也',
        sourceFormat: 'JSON',
        content: JSON.stringify({
          yesterday: 'ユーザー調査',
          today: 'デザイン改善',
          issues: ['ユーザビリティ低下']
        })
      },
      {
        memberId: 'EMP009',
        memberName: '小林麗子',
        sourceFormat: 'CSV',
        content: 'yesterday,today,issue\nモニタリング,アラート設定,障害検知遅延'
      }
    ];

    // 10人中9人が提出完了（EMP010未提出）
    const allTeamMemberIds = [
      'EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005',
      'EMP006', 'EMP007', 'EMP008', 'EMP009', 'EMP010'
    ];

    // Act: 未提出者を検出して通知
    const result = await detectAndNotifyUnsubmitted(
      rawReports,
      allTeamMemberIds,
      reportDate,
      cutoffTime
    );

    // Assert: 結果を検証
    
    // 1. 提出済み日報が正規化されていることを確認
    expect(result.processedReports).toBeDefined();
    expect(result.processedReports.length).toBe(9);

    // 2. 各レコードが統一フォーマットに正規化されていることを確認
    result.processedReports.forEach((report) => {
      expect(report).toHaveProperty('memberId');
      expect(report).toHaveProperty('memberName');
      expect(report).toHaveProperty('reportDate');
      expect(report).toHaveProperty('yesterdayWork');
      expect(report).toHaveProperty('todayWork');
      expect(report).toHaveProperty('issues');
      expect(report).toHaveProperty('extractedAt');
      expect(report).toHaveProperty('sourceFormat');
      expect(report).toHaveProperty('normalizedFormat');
    });

    // 3. normalizedFormat が全て 'UNIFIED_V1' であることを確認
    result.processedReports.forEach((report) => {
      expect(report.normalizedFormat).toBe('UNIFIED_V1');
    });

    // 4. sourceFormat が元の形式を保持していることを確認
    const sourceFormats = result.processedReports.map((r) => r.sourceFormat);
    expect(sourceFormats).toContain('TEXT');
    expect(sourceFormats).toContain('JSON');
    expect(sourceFormats).toContain('CSV');

    // 5. extractedAt がISO形式タイムスタンプであることを確認
    result.processedReports.forEach((report) => {
      const extractedTime = new Date(report.extractedAt);
      expect(extractedTime).toBeInstanceOf(Date);
      expect(extractedTime.getTime()).toBeGreaterThanOrEqual(cutoffTime.getTime());
    });

    // 6. 同一メンバーの複数形式（存在する場合）が同じ統一フォーマットに正規化されていることを確認
    const emp001Reports = result.processedReports.filter((r) => r.memberId === 'EMP001');
    expect(emp001Reports.length).toBe(1);
    expect(emp001Reports[0].normalizedFormat).toBe('UNIFIED_V1');
    expect(emp001Reports[0].sourceFormat).toBe('TEXT');

    // 7. 未提出メンバーが正しく特定されていることを確認
    expect(result.unsubmittedMembers).toBeDefined();
    expect(result.unsubmittedMembers.length).toBe(1);
    expect(result.unsubmittedMembers[0]).toBe('EMP010');

    // 8. 通知対象が生成されていることを確認
    expect(result.notificationPayload).toBeDefined();
    expect(result.notificationPayload.unsubmittedCount).toBe(1);
    expect(result.notificationPayload.unsubmittedMemberIds).toEqual(['EMP010']);
    expect(result.notificationPayload.submissionDate).toBe(reportDate);

    // 9. 各レコードの内容が正規化されているか確認（TEXT形式の例）
    const textReport = result.processedReports.find((r) => r.sourceFormat === 'TEXT');
    expect(textReport).toBeDefined();
    expect(textReport!.yesterdayWork).toBeTruthy();
    expect(textReport!.todayWork).toBeTruthy();
    expect(Array.isArray(textReport!.issues)).toBe(true);
    expect(textReport!.issues.length).toBeGreaterThan(0);

    // 10. JSON形式が正規化されているか確認
    const jsonReport = result.processedReports.find((r) => r.sourceFormat === 'JSON');
    expect(jsonReport).toBeDefined();
    expect(jsonReport!.yesterdayWork).toBeTruthy();
    expect(jsonReport!.todayWork).toBeTruthy();
    expect(Array.isArray(jsonReport!.issues)).toBe(true);

    // 11. CSV形式が正規化されているか確認
    const csvReport = result.processedReports.find((r) => r.sourceFormat === 'CSV');
    expect(csvReport).toBeDefined();
    expect(csvReport!.yesterdayWork).toBeTruthy();
    expect(csvReport!.todayWork).toBeTruthy();
    expect(Array.isArray(csvReport!.issues)).toBe(true);

    // 12. 正規化された日報の日付が指定した日付と一致していることを確認
    result.processedReports.forEach((report) => {
      expect(report.reportDate).toBe(reportDate);
    });

    // 13. 提出率が計算されていることを確認
    expect(result.submissionRate).toBeDefined();
    expect(result.submissionRate).toBe(0.9); // 9/10 = 90%

    // 14. Action 3への入力準備が完了していることを確認
    expect(result.readyForNextAction).toBe(true);
  });
});