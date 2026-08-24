import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import { type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('tx-6-imp-1: 日報収集から分析レポート生成までの自動実行', () => {
  // SCEN-3173
  test('日報データの品質が基準を下回る場合に副作用確定前に人へ引き継ぐ', async () => {
    const executionTimestamp = new Date('2024-01-15T09:00:00Z');
    const analysisStartDate = '2024-01-08';
    const analysisEndDate = '2024-01-14';
    const teamId = 'team-001';

    const input = {
      executionTimestamp,
      analysisStartDate,
      analysisEndDate,
      teamId,
    };

    // Action 1: 前週の日報データを自動収集 - 10名全員分が取得された状態
    const mockReportData = [
      {
        memberId: 'member-001',
        memberName: 'Engineer A',
        reportDate: '2024-01-08',
        yesterday: 'Completed feature X',
        today: 'Start feature Y',
        issues: 'Database connection timeout',
      },
      {
        memberId: 'member-002',
        memberName: 'Engineer B',
        reportDate: '2024-01-08',
        yesterday: 'Fixed bug Z',
        today: 'Review PR',
        issues: 'Memory leak suspected',
      },
      {
        memberId: 'member-003',
        memberName: 'Engineer C',
        reportDate: '2024-01-08',
        yesterday: 'Deploy v1.0',
        today: 'Monitor production',
        issues: 'High CPU usage',
      },
      {
        memberId: 'member-004',
        memberName: 'Engineer D',
        reportDate: '2024-01-08',
        yesterday: 'Write unit tests',
        today: 'Refactor module A',
        issues: 'Test coverage low',
      },
      {
        memberId: 'member-005',
        memberName: 'Engineer E',
        reportDate: '2024-01-08',
        yesterday: 'Update documentation',
        today: 'Code review',
        issues: 'Unclear requirements',
      },
      {
        memberId: 'member-006',
        memberName: 'Engineer F',
        reportDate: '2024-01-09',
        yesterday: 'Implement API endpoint',
        today: 'Add error handling',
        issues: 'Rate limiting issue',
      },
      {
        memberId: 'member-007',
        memberName: 'Engineer G',
        reportDate: '2024-01-09',
        yesterday: 'Database migration',
        today: 'Verify data integrity',
        issues: 'Schema mismatch',
      },
      {
        memberId: 'member-008',
        memberName: 'Engineer H',
        reportDate: '2024-01-09',
        yesterday: 'Security audit',
        today: 'Fix vulnerabilities',
        issues: 'SQL injection risk',
      },
      {
        memberId: 'member-009',
        memberName: 'Engineer I',
        reportDate: '2024-01-10',
        yesterday: 'Performance optimization',
        today: 'Load testing',
        issues: 'Network latency',
      },
      {
        memberId: 'member-010',
        memberName: 'Engineer J',
        reportDate: '2024-01-10',
        yesterday: 'CI/CD pipeline setup',
        today: 'Debug build failures',
        issues: 'Dependency conflict',
      },
    ];

    // Action 2: 未提出メンバーを特定し、リマインド通知を送信 - 全員提出済みを想定
    const unsubmittedMembers: string[] = [];

    // Action 3: テキスト解析で課題を抽出 - 品質スコアが基準値未満のデータを返す
    const mockExtractKeywordsResult = {
      keywords: [
        {
          keyword: 'Database connection timeout',
          frequency: 1,
          qualityScore: 45, // 基準値75未満 - 低品質
          extractionConfidence: 0.62,
        },
        {
          keyword: 'Memory leak',
          frequency: 1,
          qualityScore: 38, // 基準値75未満 - 低品質
          extractionConfidence: 0.55,
        },
        {
          keyword: 'High CPU usage',
          frequency: 1,
          qualityScore: 42, // 基準値75未満 - 低品質
          extractionConfidence: 0.58,
        },
      ],
      overallQualityScore: 41.67, // 全体品質スコア: (45 + 38 + 42) / 3 = 41.67 < 75
      dataQualityThreshold: 75,
    };

    const mockAiClient: Tx6Imp1AiClient = {
      buildAction01Prompt: jest.fn().mockReturnValue('Action 1 Prompt'),
      ACTION_01_PROMPT_VERSION: '1.0.0',
      buildAction02Prompt: jest.fn().mockReturnValue('Action 2 Prompt'),
      ACTION_02_PROMPT_VERSION: '1.0.0',
      buildAction03Prompt: jest.fn().mockReturnValue('Action 3 Prompt'),
      ACTION_03_PROMPT_VERSION: '1.0.0',
      buildAction04Prompt: jest.fn().mockReturnValue('Action 4 Prompt'),
      ACTION_04_PROMPT_VERSION: '1.0.0',
      buildAction05Prompt: jest.fn().mockReturnValue('Action 5 Prompt'),
      ACTION_05_PROMPT_VERSION: '1.0.0',
      buildAction06Prompt: jest.fn().mockReturnValue('Action 6 Prompt'),
      ACTION_06_PROMPT_VERSION: '1.0.0',
      buildAction07Prompt: jest.fn().mockReturnValue('Action 7 Prompt'),
      ACTION_07_PROMPT_VERSION: '1.0.0',
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest
        .fn()
        .mockResolvedValue(mockExtractKeywordsResult),
      assessImpactScore: jest.fn().mockResolvedValue({ impactScore: 65 }),
      classifyIssueSeverity: jest
        .fn()
        .mockResolvedValue({ severity: 'medium' }),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest
        .fn()
        .mockResolvedValue({ status: 'sent' }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest
        .fn()
        .mockResolvedValue({ delivered: unsubmittedMembers.length === 0 }),
    };

    let auditLogEntry: any = null;

    const mockAuditLogger = {
      logEvent: jest.fn((event: any) => {
        auditLogEntry = event;
      }),
      logEscalation: jest.fn((escalationEvent: any) => {
        auditLogEntry = escalationEvent;
      }),
    };

    // エスカレーション条件をトリガー: 品質スコアが基準値未満
    const result = await runTx6Imp1Agent(input, mockAiClient, {
      textAnalysisAdapter: mockTextAnalysisAdapter,
      notificationAdapter: mockNotificationAdapter,
      auditLogger: mockAuditLogger,
      reportDataSource: () => Promise.resolve(mockReportData),
    });

    // 検証1: エスカレーション条件「データ品質が基準を下回る」が検出されたこと
    expect(result.executionStatus).toBe('escalation_required');
    expect(result.escalationReason).toBe('data_quality_below_threshold');

    // 検証2: 品質スコアが基準値未満であることが検出されたこと
    expect(result.qualityScore).toBe(41.67);
    expect(result.qualityThreshold).toBe(75);
    expect(result.qualityScore < result.qualityThreshold).toBe(true);

    // 検証3: 副作用確定前の状態でAction 5以降が未実行であること
    expect(result.reportId).toBeUndefined();
    expect(result.reportGeneratedAt).toBeUndefined();
    expect(result.emailSentAt).toBeUndefined();
    expect(result.extractedIssueCount).toBeUndefined();
    expect(result.topPriorityIssues).toBeUndefined();

    // 検証4: 部長への引き継ぎイベントが発行されたこと
    expect(result.handoverToManager).toBe(true);
    expect(result.handoverTimestamp).toBeDefined();

    // 検証5: 監査ログに適切なエスカレーション情報が記録されていること
    expect(auditLogEntry).toBeDefined();
    expect(auditLogEntry.escalation_trigger).toBe(
      'data_quality_below_threshold'
    );
    expect(auditLogEntry.quality_score).toBe(41.67);
    expect(auditLogEntry.data_quality_threshold).toBe(75);
    expect(auditLogEntry.timestamp).toBeDefined();
    expect(new Date(auditLogEntry.timestamp).toISOString()).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
    );
    expect(auditLogEntry.actor).toBe('tx6_imp1_agent');
    expect(auditLogEntry.escalation_target).toBe('department_head');

    // 検証6: Action 1-3が完了し、Action 4での優先度判定も開始されていないこと
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockAiClient.buildAction04Prompt).not.toHaveBeenCalled();
    expect(mockAiClient.buildAction05Prompt).not.toHaveBeenCalled();
    expect(mockAiClient.buildAction06Prompt).not.toHaveBeenCalled();
    expect(mockAiClient.buildAction07Prompt).not.toHaveBeenCalled();

    // 検証7: 部長への詳細な引き継ぎ情報が含まれていること
    expect(result.escalationDetails).toBeDefined();
    expect(result.escalationDetails.affectedActions).toContain('action_04');
    expect(result.escalationDetails.affectedActions).toContain('action_05');
    expect(result.escalationDetails.affectedActions).toContain('action_06');
    expect(result.escalationDetails.affectedActions).toContain('action_07');
    expect(result.escalationDetails.qualityIssues).toBeDefined();
    expect(result.escalationDetails.qualityIssues.length).toBeGreaterThan(0);
    expect(
      result.escalationDetails.qualityIssues.some((issue: any) =>
        issue.keyword.includes('Database')
      )
    ).toBe(true);

    // 検証8: レポート生成・配信のいかなる副作用も確定していないこと
    expect(result.reportDistributionStatus).toBeUndefined();
    expect(result.emailDeliveryStatus).toBeUndefined();
  });
});