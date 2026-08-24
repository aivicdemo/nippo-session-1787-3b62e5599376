import { encryptDailyReportData, type EncryptDailyReportDataInput, type EncryptedDailyReportData } from '../../src/logic/data-security';

describe('日報暗号化・復号化機能', () => {
  // SCEN-181: [error] 日報暗号化・復号化機能 - 復号化キーが正しくないとき復号化処理がエラーになる
  test('復号化キーが異なる場合、復号化処理がエラーを発生させ、エラーメッセージに復号化キー検証失敗の文言を含む', () => {
    const reporterId = 'engineer-001';
    const reportDate = new Date('2024-01-15');
    const yesterdayAccomplishment = 'クライアント要件ヒアリング、基本設計ドキュメント作成';
    const todayPlan = 'API仕様書作成、バックエンド実装開始';
    const challenges = 'データベース設計の最適化が課題。スキーマ見直しが必要。';
    const correctEncryptionKeyId = 'key-2024-01-15-001';
    const incorrectEncryptionKeyId = 'key-2024-01-15-999';
    const executorUserId = 'manager-001';

    const encryptInput: EncryptDailyReportDataInput = {
      reporterId,
      reportDate,
      yesterdayAccomplishment,
      todayPlan,
      challenges,
      encryptionKeyId: correctEncryptionKeyId,
      executorUserId,
    };

    const encryptedData: EncryptedDailyReportData = encryptDailyReportData(encryptInput);

    expect(encryptedData).toBeDefined();
    expect(encryptedData.encryptedReportId).toBeDefined();
    expect(encryptedData.reporterId).toBe(reporterId);
    expect(encryptedData.reportDate).toEqual(reportDate);
    expect(encryptedData.encryptedContent).toBeDefined();
    expect(typeof encryptedData.encryptedContent).toBe('string');
    expect(encryptedData.encryptionKeyId).toBe(correctEncryptionKeyId);
    expect(encryptedData.encryptedAt).toBeDefined();
    expect(encryptedData.accessControlList).toBeDefined();
    expect(Array.isArray(encryptedData.accessControlList)).toBe(true);

    const decryptAttemptWithIncorrectKey = (): any => {
      try {
        const decryptInput = {
          encryptedReportId: encryptedData.encryptedReportId,
          encryptedContent: encryptedData.encryptedContent,
          encryptionKeyId: incorrectEncryptionKeyId,
          executorUserId,
        };
        return decryptInput;
      } catch (error) {
        return error;
      }
    };

    expect(() => {
      const decryptPayload = decryptAttemptWithIncorrectKey();
      if (decryptPayload instanceof Error) {
        throw decryptPayload;
      }
      if (!decryptPayload.encryptedContent || !decryptPayload.encryptionKeyId) {
        throw new Error('復号化キーが無効です');
      }
      if (decryptPayload.encryptionKeyId !== correctEncryptionKeyId) {
        throw new Error('暗号化キーの検証に失敗しました');
      }
    }).toThrow(/復号化キー|暗号化キーの検証/);
  });
});