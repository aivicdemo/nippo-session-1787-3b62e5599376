import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('tx-10-imp-1 orchestrator', () => {
  // SCEN-2625: [normal] 初回テスト報告の形式・品質判定 - 初回テスト報告が運用ルール不適合の場合、不合格と判定される
  test('should reject initial test report when required fields are empty or exceed character limits', async () => {
    const mockAiClient = {
      evaluateReportQuality: jest.fn(),
      classifyReportStatus: jest.fn(),
    };

    const reportInput = {
      userId: 'eng-001',
      yesterday: '', // ケース1: 昨日やったこと - 空
      today: 'しーあーぴーあーの脆弱性対応を進める',
      challenges: '環境構築ツールの互換性問題',
      submittedAt: new Date('2024-01-15T08:30:00Z'),
    };

    const result = await runTx10Imp1Agent(reportInput, mockAiClient);

    expect(result.status).toBe('rejected');
    expect(result.validationErrors).toContain(expect.objectContaining({
      field: 'yesterday',
      message: expect.stringMatching(/必須項目|未入力/),
    }));
    expect(result.isQualityApproved).toBe(false);
    expect(result.shouldNotifyManager).toBe(false);
    expect(result.rejectionDetails).toBeDefined();
    expect(result.rejectionDetails.userId).toBe('eng-001');
    expect(result.rejectionDetails.reason).toMatch(/必須項目が未入力|入力ルール/);
  });

  test('should reject initial test report when text exceeds character limit', async () => {
    const mockAiClient = {
      evaluateReportQuality: jest.fn(),
      classifyReportStatus: jest.fn(),
    };

    const longText = 'あ'.repeat(301);

    const reportInput = {
      userId: 'eng-002',
      yesterday: longText, // ケース4: 300字超過
      today: longText,
      challenges: longText,
      submittedAt: new Date('2024-01-15T08:45:00Z'),
    };

    const result = await runTx10Imp1Agent(reportInput, mockAiClient);

    expect(result.status).toBe('rejected');
    expect(result.validationErrors.length).toBeGreaterThan(0);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        field: expect.stringMatching(/yesterday|today|challenges/),
        message: expect.stringMatching(/文字数|上限|超えています/),
      })
    );
    expect(result.isQualityApproved).toBe(false);
    expect(result.shouldNotifyManager).toBe(false);
  });

  test('should not send manager notification when report is rejected', async () => {
    const mockAiClient = {
      evaluateReportQuality: jest.fn(),
      classifyReportStatus: jest.fn(),
    };

    const reportInput = {
      userId: 'eng-003',
      yesterday: '昨日の実装完了',
      today: '', // ケース2: 今日やること - 空
      challenges: '既知の課題なし',
      submittedAt: new Date('2024-01-15T09:00:00Z'),
    };

    const result = await runTx10Imp1Agent(reportInput, mockAiClient);

    expect(result.status).toBe('rejected');
    expect(result.shouldNotifyManager).toBe(false);
    expect(result.managerNotificationSent).toBe(false);
    expect(result.reportSavedToDB).toBe(false);
  });

  test('should log rejection details internally when report validation fails', async () => {
    const mockAiClient = {
      evaluateReportQuality: jest.fn(),
      classifyReportStatus: jest.fn(),
    };

    const reportInput = {
      userId: 'eng-004',
      yesterday: '前日の作業',
      today: '本日の予定',
      challenges: '', // ケース3: 抱えている課題 - 空
      submittedAt: new Date('2024-01-15T09:15:00Z'),
    };

    const result = await runTx10Imp1Agent(reportInput, mockAiClient);

    expect(result.status).toBe('rejected');
    expect(result.rejectionDetails).toBeDefined();
    expect(result.rejectionDetails.userId).toBe('eng-004');
    expect(result.rejectionDetails.rejectionTime).toBeDefined();
    expect(result.rejectionDetails.reason).toMatch(/必須項目が未入力|入力ルール/);
    expect(result.auditLogEntry).toBeDefined();
    expect(result.auditLogEntry.action).toBe('REPORT_REJECTED');
    expect(result.auditLogEntry.timestamp).toBeDefined();
  });

  test('should display specific error message for empty required field', async () => {
    const mockAiClient = {
      evaluateReportQuality: jest.fn(),
      classifyReportStatus: jest.fn(),
    };

    const reportInput = {
      userId: 'eng-005',
      yesterday: '', // 必須項目が空
      today: '本日の計画について',
      challenges: '対応中の課題',
      submittedAt: new Date('2024-01-15T09:30:00Z'),
    };

    const result = await runTx10Imp1Agent(reportInput, mockAiClient);

    expect(result.status).toBe('rejected');
    expect(result.userFacingErrorMessage).toMatch(/必須項目が未入力です/);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        field: 'yesterday',
      })
    );
  });

  test('should display specific error message for character limit exceeded', async () => {
    const mockAiClient = {
      evaluateReportQuality: jest.fn(),
      classifyReportStatus: jest.fn(),
    };

    const reportInput = {
      userId: 'eng-006',
      yesterday: 'あ'.repeat(250),
      today: 'あ'.repeat(250),
      challenges: 'あ'.repeat(350), // 上限を超過
      submittedAt: new Date('2024-01-15T09:45:00Z'),
    };

    const result = await runTx10Imp1Agent(reportInput, mockAiClient);

    expect(result.status).toBe('rejected');
    expect(result.userFacingErrorMessage).toMatch(/入力文字数が上限を超えています/);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        field: 'challenges',
        message: expect.stringMatching(/文字数|上限|制限/),
      })
    );
  });
});