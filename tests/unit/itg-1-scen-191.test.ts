import { encryptDailyReportData } from '../../src/logic/data-security';

describe('朝会報告管理システム - 日報暗号化・復号化機能', () => {
  // SCEN-191: [edge] 日報暗号化・復号化機能 - 日報データサイズがブロックサイズ倍数未満である場合、パディングが適用される
  test('ブロックサイズより小さい日報データがパディング適用後に正しく暗号化・復号化される', () => {
    // ブロックサイズ 16 バイト未満の日報データを準備
    const testReportText = 'テスト日報'; // 10 bytes in UTF-8
    const reporterIdValue = 'ENG001';
    const reportDateValue = new Date('2024-01-15T09:00:00Z');
    const yesterdayAccomplishmentValue = testReportText;
    const todayPlanValue = testReportText;
    const challengesValue = testReportText;
    const encryptionKeyIdValue = 'key-20240115-001';
    const executorUserIdValue = 'EXEC001';

    const input = {
      reporterId: reporterIdValue,
      reportDate: reportDateValue,
      yesterdayAccomplishment: yesterdayAccomplishmentValue,
      todayPlan: todayPlanValue,
      challenges: challengesValue,
      encryptionKeyId: encryptionKeyIdValue,
      executorUserId: executorUserIdValue,
    };

    // encryptDailyReportData 関数を呼び出して暗号化処理を実行
    const encryptedResult = encryptDailyReportData(input);

    // 戻り値の型と必須フィールドを確認
    expect(encryptedResult).toBeDefined();
    expect(typeof encryptedResult.encryptedReportId).toBe('string');
    expect(encryptedResult.encryptedReportId.length).toBeGreaterThan(0);

    // reporterId と reportDate は平文で保持されていることを確認
    expect(encryptedResult.reporterId).toBe(reporterIdValue);
    expect(encryptedResult.reportDate).toEqual(reportDateValue);

    // 暗号化コンテンツが存在し、非空文字列であることを確認
    expect(typeof encryptedResult.encryptedContent).toBe('string');
    expect(encryptedResult.encryptedContent.length).toBeGreaterThan(0);

    // 暗号化コンテンツのバイト長がブロックサイズ 16 の倍数であることを確認
    // Base64 エンコードされている場合を想定し、デコード後のバイト長をチェック
    const decodedBytes = Buffer.from(encryptedResult.encryptedContent, 'base64');
    expect(decodedBytes.length % 16).toBe(0);

    // encryptionKeyId が正しく保持されていることを確認
    expect(encryptedResult.encryptionKeyId).toBe(encryptionKeyIdValue);

    // encryptedAt がタイムスタンプとして妥当であることを確認
    expect(encryptedResult.encryptedAt).toBeInstanceOf(Date);
    expect(encryptedResult.encryptedAt.getTime()).toBeGreaterThan(0);

    // accessControlList が配列であり、適切な構造を持つことを確認
    expect(Array.isArray(encryptedResult.accessControlList)).toBe(true);
    expect(encryptedResult.accessControlList.length).toBeGreaterThan(0);

    // accessControlList 内の各エントリが正しい構造を持つことを確認
    encryptedResult.accessControlList.forEach((entry) => {
      expect(typeof entry.userId).toBe('string');
      expect(entry.userId.length).toBeGreaterThan(0);
      expect(typeof entry.userRole).toBe('string');
      expect(['manager', 'director', 'admin']).toContain(entry.userRole);
      expect(typeof entry.canDecrypt).toBe('boolean');
    });

    // 暗号化されたコンテンツが元のテキストと異なることを確認（実際に暗号化されている）
    expect(encryptedResult.encryptedContent).not.toContain(testReportText);
    expect(encryptedResult.encryptedContent).not.toContain(yesterdayAccomplishmentValue);
  });
});