import { encryptDailyReportData, type EncryptDailyReportDataInput, type EncryptedDailyReportData } from '../../src/logic/data-security';

describe('日報の暗号化・復号化機能', () => {
  // SCEN-167
  test('[normal] 複数の日報を同時に暗号化してそれぞれ独立に保存される', () => {
    // 準備: ユーザーA、B、Cの日報入力データを作成
    const reportDateA = new Date('2024-01-15T00:00:00Z');
    const reportDateB = new Date('2024-01-15T00:00:00Z');
    const reportDateC = new Date('2024-01-15T00:00:00Z');

    const inputReportA: EncryptDailyReportDataInput = {
      reporterId: 'user-a-id',
      reportDate: reportDateA,
      yesterdayAccomplishment: 'タスクA完了',
      todayPlan: 'タスクB開始',
      challenges: '課題1',
      encryptionKeyId: 'key-001',
      executorUserId: 'executor-user-id'
    };

    const inputReportB: EncryptDailyReportDataInput = {
      reporterId: 'user-b-id',
      reportDate: reportDateB,
      yesterdayAccomplishment: 'タスクC完了',
      todayPlan: 'タスクD開始',
      challenges: '課題2',
      encryptionKeyId: 'key-002',
      executorUserId: 'executor-user-id'
    };

    const inputReportC: EncryptDailyReportDataInput = {
      reporterId: 'user-c-id',
      reportDate: reportDateC,
      yesterdayAccomplishment: 'タスクE完了',
      todayPlan: 'タスクF開始',
      challenges: '課題3',
      encryptionKeyId: 'key-003',
      executorUserId: 'executor-user-id'
    };

    // ユーザーAの日報1を暗号化
    const encryptedReportA: EncryptedDailyReportData = encryptDailyReportData(inputReportA);

    // ユーザーBの日報2を暗号化
    const encryptedReportB: EncryptedDailyReportData = encryptDailyReportData(inputReportB);

    // ユーザーCの日報3を暗号化
    const encryptedReportC: EncryptedDailyReportData = encryptDailyReportData(inputReportC);

    // 検証: 3つの暗号化日報がそれぞれ独立した構造で生成されたことを確認
    expect(encryptedReportA).toBeDefined();
    expect(encryptedReportB).toBeDefined();
    expect(encryptedReportC).toBeDefined();

    // 検証: 各日報のreporterIdが正しく保持されている（平文で保持、検索用）
    expect(encryptedReportA.reporterId).toBe('user-a-id');
    expect(encryptedReportB.reporterId).toBe('user-b-id');
    expect(encryptedReportC.reporterId).toBe('user-c-id');

    // 検証: 各日報のreportDateが正しく保持されている（平文で保持、検索用）
    expect(encryptedReportA.reportDate).toEqual(reportDateA);
    expect(encryptedReportB.reportDate).toEqual(reportDateB);
    expect(encryptedReportC.reportDate).toEqual(reportDateC);

    // 検証: encryptedContentが暗号化されている（平文ではないことを確認）
    expect(encryptedReportA.encryptedContent).toBeDefined();
    expect(encryptedReportB.encryptedContent).toBeDefined();
    expect(encryptedReportC.encryptedContent).toBeDefined();

    // 検証: encryptedContentが異なる（各日報が独立に暗号化されている）
    expect(encryptedReportA.encryptedContent).not.toBe(encryptedReportB.encryptedContent);
    expect(encryptedReportB.encryptedContent).not.toBe(encryptedReportC.encryptedContent);
    expect(encryptedReportA.encryptedContent).not.toBe(encryptedReportC.encryptedContent);

    // 検証: 各日報のencryptionKeyIdが正しく保持されている
    expect(encryptedReportA.encryptionKeyId).toBe('key-001');
    expect(encryptedReportB.encryptionKeyId).toBe('key-002');
    expect(encryptedReportC.encryptionKeyId).toBe('key-003');

    // 検証: encryptedAtが設定されている（ISO 8601形式）
    expect(encryptedReportA.encryptedAt).toBeDefined();
    expect(encryptedReportB.encryptedAt).toBeDefined();
    expect(encryptedReportC.encryptedAt).toBeDefined();

    // 検証: encryptedAtが有効なDate型である
    expect(encryptedReportA.encryptedAt instanceof Date).toBe(true);
    expect(encryptedReportB.encryptedAt instanceof Date).toBe(true);
    expect(encryptedReportC.encryptedAt instanceof Date).toBe(true);

    // 検証: accessControlListが定義されている
    expect(encryptedReportA.accessControlList).toBeDefined();
    expect(encryptedReportB.accessControlList).toBeDefined();
    expect(encryptedReportC.accessControlList).toBeDefined();

    // 検証: accessControlListが配列である
    expect(Array.isArray(encryptedReportA.accessControlList)).toBe(true);
    expect(Array.isArray(encryptedReportB.accessControlList)).toBe(true);
    expect(Array.isArray(encryptedReportC.accessControlList)).toBe(true);

    // 検証: 各accessControlListエントリにuserIdが存在する
    expect(encryptedReportA.accessControlList.length).toBeGreaterThan(0);
    expect(encryptedReportB.accessControlList.length).toBeGreaterThan(0);
    expect(encryptedReportC.accessControlList.length).toBeGreaterThan(0);

    // 検証: accessControlListのエントリがcanDecryptプロパティを持つ
    encryptedReportA.accessControlList.forEach(entry => {
      expect(entry.canDecrypt).toBeDefined();
      expect(typeof entry.canDecrypt).toBe('boolean');
    });
    encryptedReportB.accessControlList.forEach(entry => {
      expect(entry.canDecrypt).toBeDefined();
      expect(typeof entry.canDecrypt).toBe('boolean');
    });
    encryptedReportC.accessControlList.forEach(entry => {
      expect(entry.canDecrypt).toBeDefined();
      expect(typeof entry.canDecrypt).toBe('boolean');
    });

    // 検証: encryptedReportIdが生成されている（一意識別子）
    expect(encryptedReportA.encryptedReportId).toBeDefined();
    expect(encryptedReportB.encryptedReportId).toBeDefined();
    expect(encryptedReportC.encryptedReportId).toBeDefined();

    // 検証: 各日報のencryptedReportIdが異なる（一意性）
    expect(encryptedReportA.encryptedReportId).not.toBe(encryptedReportB.encryptedReportId);
    expect(encryptedReportB.encryptedReportId).not.toBe(encryptedReportC.encryptedReportId);
    expect(encryptedReportA.encryptedReportId).not.toBe(encryptedReportC.encryptedReportId);

    // 検証: 暗号化キーが各日報で異なることを確認
    expect(encryptedReportA.encryptionKeyId).not.toBe(encryptedReportB.encryptionKeyId);
    expect(encryptedReportB.encryptionKeyId).not.toBe(encryptedReportC.encryptionKeyId);
    expect(encryptedReportA.encryptionKeyId).not.toBe(encryptedReportC.encryptionKeyId);

    // 検証: encryptedContentが暗号化されたテキストとして有効な形式である（Base64またはHex）
    const isBase64OrHex = (str: string): boolean => {
      return /^[A-Za-z0-9+/=]+$/.test(str) || /^[A-Fa-f0-9]+$/.test(str);
    };
    expect(isBase64OrHex(encryptedReportA.encryptedContent)).toBe(true);
    expect(isBase64OrHex(encryptedReportB.encryptedContent)).toBe(true);
    expect(isBase64OrHex(encryptedReportC.encryptedContent)).toBe(true);
  });
});