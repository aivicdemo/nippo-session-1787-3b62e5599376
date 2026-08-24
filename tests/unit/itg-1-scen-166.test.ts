import { encryptDailyReportData } from '../../src/logic/data-security';

describe('日報の暗号化・復号化機能', () => {
  // SCEN-166
  test('[normal] 単一の日報を暗号化・復号化してもデータが破損しない', () => {
    // テスト対象の日報データを準備
    const originalReporterId = 'engineer_001';
    const originalReportDate = new Date('2024-01-15T09:00:00Z');
    const originalYesterdayAccomplishment = 'API仕様確認';
    const originalTodayPlan = '実装開始';
    const originalChallenges = 'ドキュメント不足';
    const encryptionKeyId = 'key_v1_2024';
    const executorUserId = 'manager_001';

    // 日報暗号化処理を実行
    const encryptedResult = encryptDailyReportData(
      {
        reporterId: originalReporterId,
        reportDate: originalReportDate,
        yesterdayAccomplishment: originalYesterdayAccomplishment,
        todayPlan: originalTodayPlan,
        challenges: originalChallenges,
        encryptionKeyId: encryptionKeyId,
        executorUserId: executorUserId,
      },
      {
        decrypt: (encryptedContent: string) => {
          // 簡易復号化ロジック（テスト用）
          // 実装では暗号化ライブラリを使用
          const decoded = Buffer.from(encryptedContent, 'base64').toString('utf-8');
          return JSON.parse(decoded);
        },
      }
    );

    // 暗号化されたデータが元のデータと異なることを確認
    expect(encryptedResult.encryptedContent).not.toBe(
      JSON.stringify({
        yesterdayAccomplishment: originalYesterdayAccomplishment,
        todayPlan: originalTodayPlan,
        challenges: originalChallenges,
      })
    );

    // 暗号化されたデータのメタデータを検証
    expect(encryptedResult.reporterId).toBe(originalReporterId);
    expect(encryptedResult.reportDate).toEqual(originalReportDate);
    expect(encryptedResult.encryptionKeyId).toBe(encryptionKeyId);
    expect(typeof encryptedResult.encryptedAt).toBe('string');
    expect(Array.isArray(encryptedResult.accessControlList)).toBe(true);

    // 日報復号化処理を実行
    const decryptedContent = encryptedResult.accessControlList.length > 0
      ? JSON.parse(
          Buffer.from(encryptedResult.encryptedContent, 'base64').toString('utf-8')
        )
      : null;

    // 復号化されたデータと元のデータを項目ごとに比較
    expect(decryptedContent.yesterdayAccomplishment).toBe(originalYesterdayAccomplishment);
    expect(decryptedContent.todayPlan).toBe(originalTodayPlan);
    expect(decryptedContent.challenges).toBe(originalChallenges);

    // 復号化されたデータが元のデータと完全に一致することを確認
    expect(decryptedContent).toEqual({
      yesterdayAccomplishment: originalYesterdayAccomplishment,
      todayPlan: originalTodayPlan,
      challenges: originalChallenges,
    });
  });
});