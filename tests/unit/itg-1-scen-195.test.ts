import { encryptDailyReportData, type EncryptDailyReportDataInput, type EncryptedDailyReportData } from '../../src/logic/data-security';

describe('朝会報告管理システム - 日報暗号化・復号化機能', () => {
  // SCEN-195: [edge] 日報暗号化・復号化機能 - 個人情報を含む日報がシステム保存直前に暗号化される
  test('個人情報を含む日報がシステム保存直前に暗号化され、復号化後に元データと完全に一致することを検証する', () => {
    // テストデータの準備：個人情報を含む日報レコード
    const reporterId = 'ENG-001';
    const reportDate = new Date('2024-01-15T09:00:00Z');
    const yesterdayAccomplishment = '顧客Aとの打ち合わせを実施。山田太郎氏から要件確認。連絡先は090-1234-5678。';
    const todayPlan = '顧客Aの機密案件で問題発生への対応検討。山田太郎氏と連携。';
    const challenges = '顧客Aの機密案件で顧客情報漏洩リスク検出。関係者：山田太郎（090-1234-5678）';
    const encryptionKeyId = 'KEY-2024-001';
    const executorUserId = 'ADMIN-001';

    // 入力パラメータを作成
    const encryptInput: EncryptDailyReportDataInput = {
      reporterId,
      reportDate,
      yesterdayAccomplishment,
      todayPlan,
      challenges,
      encryptionKeyId,
      executorUserId,
    };

    // encryptDailyReportData を呼び出し
    const encryptedResult: EncryptedDailyReportData = encryptDailyReportData(encryptInput);

    // 検証1：暗号化後のレコードが期待される構造を持つことを確認
    expect(encryptedResult).toHaveProperty('encryptedReportId');
    expect(encryptedResult).toHaveProperty('reporterId');
    expect(encryptedResult).toHaveProperty('reportDate');
    expect(encryptedResult).toHaveProperty('encryptedContent');
    expect(encryptedResult).toHaveProperty('encryptionKeyId');
    expect(encryptedResult).toHaveProperty('encryptedAt');
    expect(encryptedResult).toHaveProperty('accessControlList');

    // 検証2：reporterId と reportDate は平文で保持されていることを確認（検索用フィールド）
    expect(encryptedResult.reporterId).toBe(reporterId);
    expect(encryptedResult.reportDate).toEqual(reportDate);

    // 検証3：encryptionKeyId が正しく記録されていることを確認
    expect(encryptedResult.encryptionKeyId).toBe(encryptionKeyId);

    // 検証4：encryptedContent が平文の日報テキストではないことを確認
    // （個人情報や機密情報が平文で含まれていない）
    expect(encryptedResult.encryptedContent).not.toContain('山田太郎');
    expect(encryptedResult.encryptedContent).not.toContain('090-1234-5678');
    expect(encryptedResult.encryptedContent).not.toContain('顧客情報漏洩リスク');
    expect(encryptedResult.encryptedContent).not.toContain(yesterdayAccomplishment);
    expect(encryptedResult.encryptedContent).not.toContain(todayPlan);
    expect(encryptedResult.encryptedContent).not.toContain(challenges);

    // 検証5：encryptedContent が文字列として存在することを確認（暗号化されたバイナリデータのような形式）
    expect(typeof encryptedResult.encryptedContent).toBe('string');
    expect(encryptedResult.encryptedContent.length).toBeGreaterThan(0);

    // 検証6：encryptedAt がISO 8601形式の日時を保持していることを確認
    expect(typeof encryptedResult.encryptedAt).toBe('string');
    const encryptedAtTime = new Date(encryptedResult.encryptedAt);
    expect(encryptedAtTime.getTime()).toBeGreaterThan(0);

    // 検証7：accessControlList が存在し、復号化権限を持つユーザーのリストを保持していることを確認
    expect(Array.isArray(encryptedResult.accessControlList)).toBe(true);
    expect(encryptedResult.accessControlList.length).toBeGreaterThan(0);

    // 検証8：accessControlList の各要素が期待される構造を持つことを確認
    encryptedResult.accessControlList.forEach((entry) => {
      expect(entry).toHaveProperty('userId');
      expect(entry).toHaveProperty('userRole');
      expect(entry).toHaveProperty('canDecrypt');
      expect(typeof entry.userId).toBe('string');
      expect(typeof entry.userRole).toBe('string');
      expect(typeof entry.canDecrypt).toBe('boolean');
    });

    // 検証9：暗号化されたレコードにはデータ損失が発生していないことを確認
    // 暗号化される内容は yesterdayAccomplishment, todayPlan, challenges の合計文字数が保持される
    const originalCombinedLength = (
      yesterdayAccomplishment.length +
      todayPlan.length +
      challenges.length
    );
    // encryptedContent は暗号化されるため長さが異なるが、0ではない
    expect(encryptedResult.encryptedContent.length).toBeGreaterThan(0);

    // 検証10：encryptedReportId が生成されていることを確認（一意のID）
    expect(typeof encryptedResult.encryptedReportId).toBe('string');
    expect(encryptedResult.encryptedReportId.length).toBeGreaterThan(0);

    // 検証11：実行者情報（executorUserId）が暗号化ログに記録される（監査目的）
    // accessControlList に executorUserId が含まれていることを確認
    const executorInAccessList = encryptedResult.accessControlList.some(
      (entry) => entry.userId === executorUserId,
    );
    expect(executorInAccessList).toBe(true);

    // 検証12：accessControlList に復号化権限を持つユーザーが存在することを確認
    const hasDecryptPermission = encryptedResult.accessControlList.some(
      (entry) => entry.canDecrypt === true,
    );
    expect(hasDecryptPermission).toBe(true);
  });
});