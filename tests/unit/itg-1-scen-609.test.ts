import { saveReport, type SaveReportInput, type SaveReportOutput } from '../../src/logic/report-persistence';

describe('朝会報告管理システム - 日報永続化', () => {
  // SCEN-609: データベースアクセスタイムアウト時の挙動検証
  test('should handle database access timeout and return user-friendly error message', async () => {
    const timeoutErrorMessage = '報告データの取得に時間がかかっています。しばらく待ってから再度お試しください';

    const reportInput: SaveReportInput = {
      reporterId: 'ENG001',
      teamId: 'TEAM001',
      reportDate: new Date('2026-08-19T00:00:00Z'),
      yesterdayAccomplishment: '実装完了',
      todayPlan: 'テスト実施',
      issuesAndConcerns: 'ライブラリの互換性問題',
      attachmentUrls: []
    };

    // Mock implementation that simulates database timeout
    const mockPersistReportWithEncryption = jest.fn().mockImplementation(
      () => new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Database connection timeout'));
        }, 35000);
      })
    );

    const mockValidateReportSubmission = jest.fn().mockReturnValue({
      isValid: true,
      errors: []
    });

    const mockEncryptReportData = jest.fn().mockReturnValue({
      encryptedContent: 'encrypted_data_string',
      encryptionMethod: 'AES-256-GCM',
      engineerId: reportInput.reporterId,
      reportDate: reportInput.reportDate,
      integrityHash: 'hash_value_string',
      accessLog: []
    });

    // Mock console.warn to verify warning is logged
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    try {
      const result = await saveReport(reportInput);
      // Should not reach here - timeout should cause error
      expect(result).toBeUndefined();
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toMatch(/報告データの取得に時間がかかっています/);
      } else {
        fail('Expected Error instance');
      }
    }

    // Verify warn was called with timeout message
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('報告データの取得に時間がかかっています')
    );

    warnSpy.mockRestore();
  });
});