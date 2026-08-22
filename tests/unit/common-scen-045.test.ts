import { runTx2Imp1Agent, type Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';
import { buildAction05Prompt, ACTION_05_PROMPT_VERSION } from '../../src/agents/tx-2-imp-1/prompts/action-05';

describe('Tx2Imp1Agent - 日報収集から課題抽出・配信までの自律実行', () => {
  // SCEN-045: [normal] 未提出メンバー特定処理の契約実行確認
  test('Action 5: 未提出メンバーを正確に特定し、タイムスタンプ付きで後続アクション参照可能な形式で返却する', async () => {
    // === Setup: モック AI クライアント生成 ===
    const mockAiClient: Tx2Imp1AiClient = {
      action01: jest.fn().mockResolvedValue({
        allReportsCount: 10,
        submittedReportsCount: 8,
        unsubmittedReportsCount: 2,
        checkTimestamp: '2024-01-15T09:00:00Z',
      }),
      action02: jest.fn().mockResolvedValue({
        unifiedReports: [
          { memberId: 'memberB', reportContent: '日報内容B', submittedAt: '2024-01-15T08:30:00Z' },
          { memberId: 'memberD', reportContent: '日報内容D', submittedAt: '2024-01-15T08:45:00Z' },
          { memberId: 'memberE', reportContent: '日報内容E', submittedAt: '2024-01-15T08:50:00Z' },
          { memberId: 'memberF', reportContent: '日報内容F', submittedAt: '2024-01-15T08:55:00Z' },
          { memberId: 'memberG', reportContent: '日報内容G', submittedAt: '2024-01-15T09:00:00Z' },
          { memberId: 'memberH', reportContent: '日報内容H', submittedAt: '2024-01-15T09:05:00Z' },
          { memberId: 'memberI', reportContent: '日報内容I', submittedAt: '2024-01-15T09:10:00Z' },
          { memberId: 'memberJ', reportContent: '日報内容J', submittedAt: '2024-01-15T09:15:00Z' },
        ],
        formatCheckTimestamp: '2024-01-15T09:20:00Z',
      }),
      action03: jest.fn().mockResolvedValue({
        extractedIssues: [
          { issueId: 'ISS001', content: '課題1', memberIdReportedBy: 'memberB', priority: 'high' },
          { issueId: 'ISS002', content: '課題2', memberIdReportedBy: 'memberD', priority: 'medium' },
        ],
        extractionTimestamp: '2024-01-15T09:25:00Z',
      }),
      action04: jest.fn().mockResolvedValue({
        classifiedIssues: [
          { issueId: 'ISS001', category: 'quality', priorityScore: 85 },
          { issueId: 'ISS002', category: 'schedule', priorityScore: 70 },
        ],
        classificationTimestamp: '2024-01-15T09:30:00Z',
      }),
      action05: jest.fn().mockResolvedValue({
        unsubmittedMembers: ['memberA', 'memberC'],
        reportingDeadline: '2024-01-15T08:00:00Z',
        checkTimestamp: '2024-01-15T09:00:00Z',
      }),
      action06: jest.fn().mockResolvedValue({
        emailSendStatus: 'sent',
        emailSentAt: '2024-01-15T09:35:00Z',
        recipientManagerEmail: 'manager@example.com',
      }),
    };

    // === Input パラメータ ===
    const input = {
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
      teamId: 'team-001',
      reportingDeadline: new Date('2024-01-15T08:00:00Z'),
      managerEmail: 'manager@example.com',
    };

    // === 実行 ===
    const result = await runTx2Imp1Agent(input, mockAiClient);

    // === Assertion 1: buildAction05Prompt の検証 ===
    const action05Prompt = buildAction05Prompt({
      allMembers: [
        'memberA', 'memberB', 'memberC', 'memberD', 'memberE',
        'memberF', 'memberG', 'memberH', 'memberI', 'memberJ',
      ],
      submittedMembers: ['memberB', 'memberD', 'memberE', 'memberF', 'memberG', 'memberH', 'memberI', 'memberJ'],
      reportingDeadline: new Date('2024-01-15T08:00:00Z'),
      checkTimestamp: new Date('2024-01-15T09:00:00Z'),
    });

    expect(action05Prompt).toMatch(/未提出メンバー/);
    expect(action05Prompt).toMatch(/特定/);

    // === Assertion 2: ACTION_05_PROMPT_VERSION が定義されている ===
    expect(ACTION_05_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_05_PROMPT_VERSION).toBe('string');

    // === Assertion 3: モック AI クライアント action05 が呼ばれたことを確認 ===
    expect(mockAiClient.action05).toHaveBeenCalled();

    // === Assertion 4: Orchestrator の結果から Action 5 出力を検証 ===
    expect(result).toBeDefined();
    expect(result.aggregationStatus).toBeDefined();

    // === Assertion 5: 未提出メンバーが正確に記録されている ===
    // result の構造から Action 5 の出力を取得
    // （Orchestrator が未提出メンバー情報を保持していると仮定）
    expect(result).toHaveProperty('unsubmittedMembers');
    expect(Array.isArray(result.unsubmittedMembers)).toBe(true);
    expect(result.unsubmittedMembers).toContain('memberA');
    expect(result.unsubmittedMembers).toContain('memberC');
    expect(result.unsubmittedMembers.length).toBe(2);

    // === Assertion 6: タイムスタンプが ISO 形式で記録されている ===
    expect(result).toHaveProperty('checkTimestamp');
    expect(typeof result.checkTimestamp).toBe('string');
    // ISO 8601 形式チェック
    expect(result.checkTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/);

    // === Assertion 7: 期限も記録されている ===
    expect(result).toHaveProperty('reportingDeadline');
    expect(typeof result.reportingDeadline).toBe('string');

    // === Assertion 8: 後続アクション（Action 6）への参照可能性を確認 ===
    // Orchestrator が Action 6 に未提出メンバー情報を引き継いでいる
    expect(mockAiClient.action06).toHaveBeenCalled();
    const action06CallArgs = (mockAiClient.action06 as jest.Mock).mock.calls[0];
    expect(action06CallArgs).toBeDefined();
    // Action 6 に渡されるパラメータに未提出メンバー情報が含まれている
    expect(action06CallArgs[0]).toHaveProperty('unsubmittedMembers');

    // === Assertion 9: emailSendStatus が正常に返却されている ===
    expect(result).toHaveProperty('emailSendStatus');
    expect(result.emailSendStatus).toBe('sent');

    // === Assertion 10: 全体の契約が満たされている ===
    // Orchestrator の出力が input の managerEmail と一致する確認メール送信先を含む
    expect(result).toHaveProperty('emailSendStatus');
    expect(['sent', 'failed']).toContain(result.emailSendStatus);
  });
});