import { encryptDailyReportData, type EncryptDailyReportDataInput, type EncryptedDailyReportData } from '../../src/logic/data-security';

describe('日報の暗号化・復号化機能', () => {
  test('SCEN-169: 日報が保存される直前の時点で暗号化が実行される', () => {
    // Arrange: テスト用の日報入力データを準備
    const input: EncryptDailyReportDataInput = {
      reporterId: 'ENG-001',
      reportDate: new Date('2024-01-15T00:00:00Z'),
      yesterdayAccomplishment: 'タスクA完了',
      todayPlan: 'タスクB開始',
      challenges: 'リソース不足',
      encryptionKeyId: 'key-2024-001',
      executorUserId: 'ADMIN-001'
    };

    // Act: 暗号化処理を実行
    const encrypted_result: EncryptedDailyReportData = encryptDailyReportData(input);

    // Assert: 1. encryptedContent が平文ではなく暗号化状態であることを確認
    // 暗号化されたデータは16進数またはBase64形式であり、元のテキストを含まない
    expect(encrypted_result.encryptedContent).not.toContain('タスクA完了');
    expect(encrypted_result.encryptedContent).not.toContain('タスクB開始');
    expect(encrypted_result.encryptedContent).not.toContain('リソース不足');
    
    // Assert: 2. encryptedContent が有効な暗号化形式（Base64）であることを確認
    const base64_regex = /^[A-Za-z0-9+/]*={0,2}$/;
    expect(encrypted_result.encryptedContent).toMatch(base64_regex);
    
    // Assert: 3. reporterId と reportDate は平文で保持されること（検索用）
    expect(encrypted_result.reporterId).toBe('ENG-001');
    expect(encrypted_result.reportDate).toEqual(new Date('2024-01-15T00:00:00Z'));
    
    // Assert: 4. 暗号化に使用したキーIDが記録されること
    expect(encrypted_result.encryptionKeyId).toBe('key-2024-001');
    
    // Assert: 5. encryptedAt が ISO 8601 形式で記録されること
    expect(encrypted_result.encryptedAt).toBeInstanceOf(Date);
    expect(encrypted_result.encryptedAt.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    
    // Assert: 6. accessControlList に復号化権限を持つユーザー（部長など）が含まれること
    expect(encrypted_result.accessControlList).toBeDefined();
    expect(encrypted_result.accessControlList.length).toBeGreaterThan(0);
    
    // Assert: 7. accessControlEntry の構造が正しいこと
    expect(encrypted_result.accessControlList[0]).toHaveProperty('userId');
    expect(encrypted_result.accessControlList[0]).toHaveProperty('userRole');
    expect(encrypted_result.accessControlList[0]).toHaveProperty('canDecrypt');
    expect(encrypted_result.accessControlList[0].canDecrypt).toBe(true);
    
    // Assert: 8. encryptedReportId が一意の識別子として生成されること
    expect(encrypted_result.encryptedReportId).toBeDefined();
    expect(encrypted_result.encryptedReportId.length).toBeGreaterThan(0);
  });
});