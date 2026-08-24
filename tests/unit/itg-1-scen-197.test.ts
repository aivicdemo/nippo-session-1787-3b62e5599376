import { encryptDailyReportData } from '../../src/logic/data-security';
import type {
  EncryptDailyReportDataInput,
  EncryptedDailyReportData,
  EncryptionKeyMetadata,
  AccessControlEntry,
} from '../../src/logic/data-security';

describe('朝会報告管理システム - データセキュリティ', () => {
  // SCEN-197: [edge] 日報暗号化・復号化機能 - 進捗情報を含む日報がシステム保存直前に暗号化される
  test('日報送信時に進捗情報を含む日報テキストがシステム保存直前に暗号化され、暗号化済み文字列でデータベースに永続化される', async () => {
    // Arrange: テスト用の進捗情報を含む日報データを準備
    const reporterId = 'engineer_001';
    const reportDate = new Date('2024-01-15T09:00:00Z');
    const yesterdayAccomplishment = 'ログイン機能の実装完了、ユーザー認証テスト実施';
    const todayPlan = 'パスワードリセット機能の実装開始、朝会報告システムの設計レビュー参加';
    const challenges = 'データベース接続のタイムアウトエラーが発生、原因調査中。10分間の接続遅延が3回発生';
    const encryptionKeyId = 'key_20240115_001';
    const executorUserId = 'system_service';

    const input: EncryptDailyReportDataInput = {
      reporterId,
      reportDate,
      yesterdayAccomplishment,
      todayPlan,
      challenges,
      encryptionKeyId,
      executorUserId,
    };

    // Act: 暗号化ロジックを実行
    const result: EncryptedDailyReportData = encryptDailyReportData(input);

    // Assert: 暗号化関数の呼び出しと出力を検証
    // 1. encryptedReportId が生成されていることを確認
    expect(result.encryptedReportId).toBeDefined();
    expect(typeof result.encryptedReportId).toBe('string');
    expect(result.encryptedReportId.length).toBeGreaterThan(0);

    // 2. reporterId と reportDate が平文で保持されていることを確認（検索用）
    expect(result.reporterId).toBe(reporterId);
    expect(result.reportDate).toEqual(reportDate);

    // 3. encryptedContent が暗号化文字列であることを確認
    // 暗号化済み文字列は Base64 または 16進数形式であることを検証
    expect(result.encryptedContent).toBeDefined();
    expect(typeof result.encryptedContent).toBe('string');
    expect(result.encryptedContent.length).toBeGreaterThan(0);

    // Base64 または 16進数形式のいずれかであることを確認
    const isBase64 = /^[A-Za-z0-9+/=]+$/.test(result.encryptedContent);
    const isHexadecimal = /^[0-9a-fA-F]+$/.test(result.encryptedContent);
    expect(isBase64 || isHexadecimal).toBe(true);

    // 4. encryptionKeyId が正しく記録されていることを確認
    expect(result.encryptionKeyId).toBe(encryptionKeyId);

    // 5. encryptedAt が ISO 8601形式で記録されていることを確認
    expect(result.encryptedAt).toBeInstanceOf(Date);
    expect(result.encryptedAt.toISOString()).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );

    // 6. accessControlList に復号化権限を持つユーザー情報が含まれていることを確認
    expect(result.accessControlList).toBeDefined();
    expect(Array.isArray(result.accessControlList)).toBe(true);
    expect(result.accessControlList.length).toBeGreaterThan(0);

    // 7. accessControlList の各要素が正しい構造を持つことを確認
    result.accessControlList.forEach((entry: AccessControlEntry) => {
      expect(entry.userId).toBeDefined();
      expect(typeof entry.userId).toBe('string');
      expect(entry.userRole).toBeDefined();
      expect(['engineer', 'manager', 'admin']).toContain(entry.userRole);
      expect(entry.canDecrypt).toBe(true);
    });

    // 8. 暗号化済みコンテンツが元のテキストを含まないことを確認（実際に暗号化されている）
    expect(result.encryptedContent).not.toContain(yesterdayAccomplishment);
    expect(result.encryptedContent).not.toContain(todayPlan);
    expect(result.encryptedContent).not.toContain(challenges);

    // 9. 生成されたデータが完全であることを確認（すべての必須フィールドが存在）
    expect(result.encryptedReportId).toBeTruthy();
    expect(result.reporterId).toBeTruthy();
    expect(result.reportDate).toBeTruthy();
    expect(result.encryptedContent).toBeTruthy();
    expect(result.encryptionKeyId).toBeTruthy();
    expect(result.encryptedAt).toBeTruthy();
    expect(result.accessControlList).toBeTruthy();

    // 10. accessControlList に manager 権限以上のユーザーが含まれていることを確認
    const hasManagerOrAbove = result.accessControlList.some(
      (entry: AccessControlEntry) =>
        entry.userRole === 'manager' || entry.userRole === 'admin'
    );
    expect(hasManagerOrAbove).toBe(true);
  });
});