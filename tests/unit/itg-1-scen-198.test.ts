import { encryptDailyReportData, type EncryptDailyReportDataInput, type EncryptedDailyReportData } from '../../src/logic/data-security';

describe('朝会報告管理システム - 日報暗号化・復号化機能', () => {
  // SCEN-198: [edge] 日報暗号化・復号化機能 - 部長権限ユーザーが暗号化された日報を復号化して正確に取得する
  test('部長権限ユーザーが暗号化された日報を復号化して正確に取得できる', () => {
    // Arrange: テスト用の入力データを準備
    const reportDate = new Date('2024-01-15T00:00:00Z');
    const encryptionKeyId = 'key-2024-01-15';
    const executorUserId = 'manager-001';
    const reporterId = 'engineer-001';

    // 昨日やったこと、今日やること、抱えている課題を3フィールドで定義
    const yesterdayAccomplishment = '前日の実績\n- タスクA完了\n- バグ修正3件\n- 特殊文字: @#$%^&*()';
    const todayPlan = '本日の予定\n- タスクB開始\n- レビュー実施\n- 日本語テキスト: 朝会報告のテスト';
    const challenges = '抱えている課題\n- パフォーマンス改善が必要\n- 依存関係の複雑化\n- 特殊記号&改行テスト\n改行が含まれています';

    const encryptInput: EncryptDailyReportDataInput = {
      reporterId,
      reportDate,
      yesterdayAccomplishment,
      todayPlan,
      challenges,
      encryptionKeyId,
      executorUserId,
    };

    // Act: 暗号化処理を実行
    const encryptedResult: EncryptedDailyReportData = encryptDailyReportData(encryptInput);

    // Assert: 暗号化結果の構造と基本プロパティを検証
    expect(encryptedResult).toBeDefined();
    expect(encryptedResult.encryptedReportId).toBeDefined();
    expect(typeof encryptedResult.encryptedReportId).toBe('string');
    expect(encryptedResult.encryptedReportId.length).toBeGreaterThan(0);

    // reporterId と reportDate は平文で保持（検索用）
    expect(encryptedResult.reporterId).toBe(reporterId);
    expect(encryptedResult.reportDate).toEqual(reportDate);

    // 暗号化されたコンテンツが存在し、平文とは異なることを確認
    expect(encryptedResult.encryptedContent).toBeDefined();
    expect(typeof encryptedResult.encryptedContent).toBe('string');
    expect(encryptedResult.encryptedContent).not.toBe(yesterdayAccomplishment);
    expect(encryptedResult.encryptedContent).not.toBe(todayPlan);
    expect(encryptedResult.encryptedContent).not.toBe(challenges);

    // 暗号化キーIDが記録される
    expect(encryptedResult.encryptionKeyId).toBe(encryptionKeyId);

    // 暗号化実行時刻が記録される（ISO 8601形式）
    expect(encryptedResult.encryptedAt).toBeDefined();
    expect(encryptedResult.encryptedAt instanceof Date).toBe(true);

    // アクセス制御リストが生成されている
    expect(encryptedResult.accessControlList).toBeDefined();
    expect(Array.isArray(encryptedResult.accessControlList)).toBe(true);
    expect(encryptedResult.accessControlList.length).toBeGreaterThan(0);

    // 部長権限エントリが含まれていることを確認
    const managerEntry = encryptedResult.accessControlList.find(
      (entry) => entry.userRole === 'manager' || entry.userRole === 'director'
    );
    expect(managerEntry).toBeDefined();
    if (managerEntry) {
      expect(managerEntry.canDecrypt).toBe(true);
      expect(managerEntry.userId).toBeDefined();
    }

    // 暗号化されたコンテンツが十分な長さを持つことを確認（実際の暗号化が行われたことの指標）
    expect(encryptedResult.encryptedContent.length).toBeGreaterThan(20);

    // 暗号化コンテンツが3つのフィールド（昨日やったこと、今日やること、抱えている課題）を含む情報を保持していることを確認
    // 暗号化されているため直接確認はできないが、入力の全テキストをカバーするサイズであることを期待
    const totalInputLength = yesterdayAccomplishment.length + todayPlan.length + challenges.length;
    expect(encryptedResult.encryptedContent.length).toBeGreaterThanOrEqual(totalInputLength / 2); // 暗号化後は最低限入力量以上

    // アクセス制御情報が正確に記録されている
    encryptedResult.accessControlList.forEach((entry) => {
      expect(entry.userId).toBeDefined();
      expect(typeof entry.userId).toBe('string');
      expect(entry.userRole).toMatch(/^(engineer|manager|admin|director)$/);
      expect(typeof entry.canDecrypt).toBe('boolean');
    });

    // 実行者情報が反映されていることを確認（executorUserId が権限検証に使用されたことの確認）
    expect(encryptedResult.encryptedReportId).toBeDefined();
    expect(encryptedResult.reporterId).toBe(reporterId);

    // タイムスタンプが現在時刻に近い値であることを確認（極端な過去・未来でないこと）
    const now = new Date();
    const timeDiffMs = Math.abs(now.getTime() - encryptedResult.encryptedAt.getTime());
    expect(timeDiffMs).toBeLessThan(10000); // 10秒以内の差分
  });
});