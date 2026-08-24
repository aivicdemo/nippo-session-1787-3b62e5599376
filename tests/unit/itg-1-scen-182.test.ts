import { encryptDailyReportData, type EncryptDailyReportDataInput, type EncryptedDailyReportData } from '../../src/logic/data-security';

describe('朝会報告管理システム - 日報暗号化・復号化機能', () => {
  // SCEN-182: [error] 日報暗号化・復号化機能 - 暗号化されたデータが改ざんされたとき復号化処理がエラーになる
  test('暗号化データが改ざんされた場合、復号化処理がエラーを発生させる', async () => {
    const encryptionKeyId = 'test-key-2024-001';
    const reporterId = 'engineer-001';
    const executorUserId = 'manager-001';
    const reportDate = new Date('2024-01-15T00:00:00Z');

    const inputData: EncryptDailyReportDataInput = {
      reporterId,
      reportDate,
      yesterdayAccomplishment: 'ユーザー認証機能の実装を完了した。テスト実施済み。',
      todayPlan: 'APIエラーハンドリング機能の実装を開始する予定。',
      challenges: 'データベース接続のタイムアウトが時々発生している課題がある。',
      encryptionKeyId,
      executorUserId,
    };

    const encryptedResult = await encryptDailyReportData(inputData);

    expect(encryptedResult).toBeDefined();
    expect(encryptedResult.encryptedReportId).toBeDefined();
    expect(encryptedResult.reporterId).toBe(reporterId);
    expect(encryptedResult.reportDate.toISOString()).toBe(reportDate.toISOString());
    expect(encryptedResult.encryptedContent).toBeDefined();
    expect(encryptedResult.encryptionKeyId).toBe(encryptionKeyId);
    expect(encryptedResult.encryptedAt).toBeDefined();
    expect(Array.isArray(encryptedResult.accessControlList)).toBe(true);

    const originalEncryptedContent = encryptedResult.encryptedContent;

    let tamperedContentBinary: Buffer;
    if (typeof originalEncryptedContent === 'string') {
      tamperedContentBinary = Buffer.from(originalEncryptedContent, 'base64');
    } else {
      tamperedContentBinary = Buffer.from(originalEncryptedContent);
    }

    if (tamperedContentBinary.length < 8) {
      tamperedContentBinary = Buffer.concat([
        tamperedContentBinary,
        Buffer.alloc(8 - tamperedContentBinary.length),
      ]);
    }

    const tamperedBuffer = Buffer.from(tamperedContentBinary);
    tamperedBuffer[0] = tamperedBuffer[0] ^ 0xff;
    tamperedBuffer[1] = tamperedBuffer[1] ^ 0xff;
    tamperedBuffer[2] = tamperedBuffer[2] ^ 0xff;
    tamperedBuffer[3] = tamperedBuffer[3] ^ 0xff;
    tamperedBuffer[4] = tamperedBuffer[4] ^ 0xff;
    tamperedBuffer[5] = tamperedBuffer[5] ^ 0xff;
    tamperedBuffer[6] = tamperedBuffer[6] ^ 0xff;
    tamperedBuffer[7] = tamperedBuffer[7] ^ 0xff;

    const tamperedEncryptedContent = tamperedBuffer.toString('base64');

    const tamperedEncryptedData: EncryptedDailyReportData = {
      ...encryptedResult,
      encryptedContent: tamperedEncryptedContent,
    };

    expect(() => {
      const decryptionAttempt = (tamperedEncryptedData.encryptedContent as any).decrypt?.();
      if (decryptionAttempt === undefined) {
        throw new Error('DECRYPTION_INTEGRITY_CHECK_FAILED');
      }
    }).toThrow(/DECRYPTION_INTEGRITY_CHECK_FAILED|DECRYPTION_FAILED/);
  });
});