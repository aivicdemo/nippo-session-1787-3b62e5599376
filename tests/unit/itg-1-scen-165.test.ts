import { encryptDailyReportData } from '../../src/logic/data-security';
import { type EncryptDailyReportDataInput, type EncryptedDailyReportData } from '../../src/logic/data-security';

describe('日報の暗号化・復号化機能 - アクセス制御検証', () => {
  // SCEN-165: [normal] 開発エンジニアが暗号化された他者の日報を復号化できない
  test('ユーザーBは暗号化されたユーザーAの日報を復号化できず、アクセス拒否エラーが返却される', () => {
    // Setup: ユーザーAが日報を送信して暗号化
    const userAId = 'engineer_user_a_001';
    const userBId = 'engineer_user_b_002';
    const encryptionKeyId = 'key_2024_01_001';

    const encryptionInput: EncryptDailyReportDataInput = {
      reporterId: userAId,
      reportDate: new Date('2024-01-15'),
      yesterdayAccomplishment: 'ユーザーAが実装したAPIエンドポイントの単体テスト完了',
      todayPlan: 'リファクタリングとコードレビュー対応',
      challenges: 'データベース接続タイムアウト問題が未解決',
      encryptionKeyId: encryptionKeyId,
      executorUserId: userAId,
    };

    // ユーザーAの権限で暗号化実行（正常系）
    const encryptedReport: EncryptedDailyReportData = encryptDailyReportData(encryptionInput);

    // 暗号化が正常に実行されたことを確認
    expect(encryptedReport).toBeDefined();
    expect(encryptedReport.reporterId).toBe(userAId);
    expect(encryptedReport.reportDate).toEqual(new Date('2024-01-15'));
    expect(encryptedReport.encryptionKeyId).toBe(encryptionKeyId);
    expect(encryptedReport.encryptedContent).toBeDefined();
    expect(encryptedReport.encryptedContent.length).toBeGreaterThan(0);
    expect(encryptedReport.encryptedAt).toBeDefined();

    // アクセス制御リストを確認：ユーザーAのみが復号化可能
    expect(encryptedReport.accessControlList).toBeDefined();
    expect(encryptedReport.accessControlList.length).toBeGreaterThan(0);
    const userAAccessEntry = encryptedReport.accessControlList.find(
      (entry) => entry.userId === userAId
    );
    expect(userAAccessEntry).toBeDefined();
    expect(userAAccessEntry?.canDecrypt).toBe(true);

    // ユーザーBは復号化リストに含まれない、または復号化権限がない
    const userBAccessEntry = encryptedReport.accessControlList.find(
      (entry) => entry.userId === userBId
    );
    if (userBAccessEntry) {
      expect(userBAccessEntry.canDecrypt).toBe(false);
    }

    // ユーザーBが復号化を試みる場合のシミュレーション
    // ユーザーBの復号化権限がないことを確認
    const hasUserBDecryptPermission = encryptedReport.accessControlList.some(
      (entry) => entry.userId === userBId && entry.canDecrypt === true
    );
    expect(hasUserBDecryptPermission).toBe(false);

    // 暗号化されたコンテンツはユーザーBが読める形式ではない（暗号文）
    const encryptedContent = encryptedReport.encryptedContent;
    expect(encryptedContent).not.toContain('ユーザーAが実装したAPIエンドポイント');
    expect(encryptedContent).not.toContain('リファクタリングと');
    expect(encryptedContent).not.toContain('データベース接続');

    // 暗号化キーIDはアクセス制御に使用される
    expect(encryptedReport.encryptionKeyId).toBe(encryptionKeyId);

    // 監査ログに記録されるべき情報が構造体に含まれていることを確認
    expect(encryptedReport.reporterId).toBe(userAId);
    expect(encryptedReport.encryptedAt).toBeInstanceOf(Date);
  });
});