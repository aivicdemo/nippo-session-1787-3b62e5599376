import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from '../../src/agents/tx-2-imp-1/prompts/action-01';
import { buildAction02Prompt, ACTION_02_PROMPT_VERSION } from '../../src/agents/tx-2-imp-1/prompts/action-02';
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from '../../src/agents/tx-2-imp-1/prompts/action-03';
import { buildAction04Prompt, ACTION_04_PROMPT_VERSION } from '../../src/agents/tx-2-imp-1/prompts/action-04';
import { buildAction05Prompt, ACTION_05_PROMPT_VERSION } from '../../src/agents/tx-2-imp-1/prompts/action-05';
import { buildAction06Prompt, ACTION_06_PROMPT_VERSION } from '../../src/agents/tx-2-imp-1/prompts/action-06';
import crypto from 'crypto';

describe('tx-2-imp-1: 日報収集から課題抽出・配信までの自律実行', () => {
  interface ExtractedIssue {
    priority: 'high' | 'medium' | 'low';
    category: string;
    description: string;
  }

  interface Tx2Imp1AiClientStub {
    executeAction01(prompt: string): Promise<{ status: string; reportCount: number }>;
    executeAction02(prompt: string): Promise<{ status: string; standardizedCount: number }>;
    executeAction03(prompt: string): Promise<{
      status: string;
      extractedIssues: ExtractedIssue[];
    }>;
    executeAction04(prompt: string): Promise<{ status: string; prioritizedIssues: ExtractedIssue[] }>;
    executeAction05(prompt: string): Promise<{ status: string; unreportedMembers: string[] }>;
    executeAction06(prompt: string): Promise<{
      status: string;
      mailContent: string;
      mailSubject: string;
    }>;
  }

  interface MailAuditEvent {
    eventType: string;
    agentId: string;
    recipient: string;
    timestamp: string;
    mailSubject: string;
    mailBodyHash: string;
    issueCount: number;
    unreportedMemberCount: number;
  }

  interface MailServiceStub {
    sendMail(recipient: string, subject: string, body: string): Promise<{ sent: boolean; mailId: string }>;
    getAuditLog(): MailAuditEvent[];
  }

  let aiClientStub: Tx2Imp1AiClientStub;
  let mailServiceStub: MailServiceStub;
  const TEST_TIMESTAMP = '2024-01-15T09:00:00Z';
  const MANAGER_EMAIL = 'manager@example.com';

  beforeEach(() => {
    const auditLog: MailAuditEvent[] = [];

    aiClientStub = {
      executeAction01: jest.fn().mockResolvedValue({
        status: 'success',
        reportCount: 10,
      }),
      executeAction02: jest.fn().mockResolvedValue({
        status: 'success',
        standardizedCount: 10,
      }),
      executeAction03: jest.fn().mockResolvedValue({
        status: 'success',
        extractedIssues: [
          {
            priority: 'high',
            category: 'technical',
            description: 'データベース接続エラー',
          },
          {
            priority: 'high',
            category: 'technical',
            description: 'APIレスポンス遅延',
          },
          {
            priority: 'medium',
            category: 'process',
            description: 'レビュー待ちプルリクエスト',
          },
          {
            priority: 'low',
            category: 'administrative',
            description: 'ドキュメント更新',
          },
        ],
      }),
      executeAction04: jest.fn().mockResolvedValue({
        status: 'success',
        prioritizedIssues: [
          {
            priority: 'high',
            category: 'technical',
            description: 'データベース接続エラー',
          },
          {
            priority: 'high',
            category: 'technical',
            description: 'APIレスポンス遅延',
          },
          {
            priority: 'medium',
            category: 'process',
            description: 'レビュー待ちプルリクエスト',
          },
          {
            priority: 'low',
            category: 'administrative',
            description: 'ドキュメント更新',
          },
        ],
      }),
      executeAction05: jest.fn().mockResolvedValue({
        status: 'success',
        unreportedMembers: ['田中太郎', '鈴木花子'],
      }),
      executeAction06: jest.fn().mockResolvedValue({
        status: 'success',
        mailContent: `【朝会報告】日報確認メール - 2024-01-15

【優先度別課題一覧】

【高優先度】🔴
1. データベース接続エラー (technical)
2. APIレスポンス遅延 (technical)

【中優先度】🟡
1. レビュー待ちプルリクエスト (process)

【低優先度】⚪
1. ドキュメント更新 (administrative)

【未提出メンバー】
- 田中太郎
- 鈴木花子

【生成時刻】
2024-01-15T09:00:00Z

【差分情報】
前回配信から新規課題: 0件
再発課題: 0件
解決済み課題: 0件`,
        mailSubject: '【朝会報告】日報確認メール - 2024-01-15',
      }),
    };

    mailServiceStub = {
      sendMail: jest.fn(async (recipient: string, subject: string, body: string) => {
        const mailBodyHash = crypto.createHash('sha256').update(body).digest('hex');
        const priorityHighMatches = (body.match(/🔴/g) || []).length;
        const priorityMediumMatches = (body.match(/🟡/g) || []).length;
        const priorityLowMatches = (body.match(/⚪/g) || []).length;
        const totalIssues = priorityHighMatches + priorityMediumMatches + priorityLowMatches;
        const unreportedMatches = (body.match(/^- /gm) || []).filter(
          (line) => !line.includes('【') && !line.includes('】'),
        ).length;

        auditLog.push({
          eventType: 'MAIL_SENT',
          agentId: 'tx-2-imp-1',
          recipient,
          timestamp: TEST_TIMESTAMP,
          mailSubject: subject,
          mailBodyHash,
          issueCount: totalIssues,
          unreportedMemberCount: unreportedMatches,
        });

        return {
          sent: true,
          mailId: crypto.randomUUID(),
        };
      }),
      getAuditLog: () => auditLog,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-3102: [normal] 日報収集から課題抽出・配信までの自律実行 AIエージェント - 確認メール自動生成・配信処理の契約確認
  test('should execute complete autonomous workflow from report collection to confirmation email delivery', async () => {
    // Verify all prompt modules export correctly
    const action01Prompt = buildAction01Prompt({ executionTimestamp: new Date(TEST_TIMESTAMP) });
    expect(ACTION_01_PROMPT_VERSION).toBeDefined();
    expect(typeof action01Prompt).toBe('string');
    expect(action01Prompt.length).toBeGreaterThan(0);

    const action02Prompt = buildAction02Prompt({
      executionTimestamp: new Date(TEST_TIMESTAMP),
      reportDataList: [],
    });
    expect(ACTION_02_PROMPT_VERSION).toBeDefined();
    expect(typeof action02Prompt).toBe('string');

    const action03Prompt = buildAction03Prompt({
      executionTimestamp: new Date(TEST_TIMESTAMP),
      standardizedReports: [],
    });
    expect(ACTION_03_PROMPT_VERSION).toBeDefined();
    expect(typeof action03Prompt).toBe('string');

    const action04Prompt = buildAction04Prompt({
      executionTimestamp: new Date(TEST_TIMESTAMP),
      extractedIssues: [
        { priority: 'high', category: 'technical', description: 'Database error' },
      ],
    });
    expect(ACTION_04_PROMPT_VERSION).toBeDefined();
    expect(typeof action04Prompt).toBe('string');

    const action05Prompt = buildAction05Prompt({
      executionTimestamp: new Date(TEST_TIMESTAMP),
      allMemberIds: [],
      reportedMemberIds: [],
    });
    expect(ACTION_05_PROMPT_VERSION).toBeDefined();
    expect(typeof action05Prompt).toBe('string');

    const action06Prompt = buildAction06Prompt({
      executionTimestamp: new Date(TEST_TIMESTAMP),
      prioritizedIssues: [
        { priority: 'high', category: 'technical', description: 'Database error' },
      ],
      unreportedMembers: ['user1'],
      managerEmail: MANAGER_EMAIL,
    });
    expect(ACTION_06_PROMPT_VERSION).toBeDefined();
    expect(typeof action06Prompt).toBe('string');

    // Prepare test input data simulating completion of actions 1-5
    const testInput = {
      executionTimestamp: new Date(TEST_TIMESTAMP),
      reportDeadlineTime: new Date('2024-01-15T09:30:00Z'),
      targetTeamIds: ['team-001'],
      managerUserIds: ['mgr-001'],
    };

    // Execute the orchestrator
    const result = await runTx2Imp1Agent(testInput, aiClientStub);

    // Verify success flag
    expect(result.success).toBe(true);

    // Verify mailSentAt is ISO format timestamp
    expect(typeof result.mailSentAt).toBe('string');
    expect(result.mailSentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // Verify recipient address is correctly set
    expect(result.recipientAddress).toBe(MANAGER_EMAIL);

    // Verify issue and unreported member counts
    expect(typeof result.issuesProcessed).toBe('number');
    expect(result.issuesProcessed).toBeGreaterThanOrEqual(0);
    expect(typeof result.unreportedMembersNotified).toBe('number');
    expect(result.unreportedMembersNotified).toBeGreaterThanOrEqual(0);

    // Verify auditEventId is UUID format
    expect(typeof result.auditEventId).toBe('string');
    expect(result.auditEventId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    // Verify audit log contains MAIL_SENT event
    const auditLog = mailServiceStub.getAuditLog();
    expect(auditLog.length).toBeGreaterThan(0);

    const mailSentEvent = auditLog.find((event) => event.eventType === 'MAIL_SENT');
    expect(mailSentEvent).toBeDefined();
    expect(mailSentEvent?.agentId).toBe('tx-2-imp-1');
    expect(mailSentEvent?.recipient).toBe(MANAGER_EMAIL);
    expect(mailSentEvent?.timestamp).toBe(TEST_TIMESTAMP);
    expect(typeof mailSentEvent?.mailBodyHash).toBe('string');
    expect(mailSentEvent?.mailBodyHash).toMatch(/^[a-f0-9]{64}$/);
    expect(typeof mailSentEvent?.issueCount).toBe('number');
    expect(mailSentEvent?.issueCount).toBeGreaterThanOrEqual(0);
    expect(typeof mailSentEvent?.unreportedMemberCount).toBe('number');
    expect(mailSentEvent?.unreportedMemberCount).toBeGreaterThanOrEqual(0);

    // Verify all AI actions were called in sequence
    expect(aiClientStub.executeAction01).toHaveBeenCalled();
    expect(aiClientStub.executeAction02).toHaveBeenCalled();
    expect(aiClientStub.executeAction03).toHaveBeenCalled();
    expect(aiClientStub.executeAction04).toHaveBeenCalled();
    expect(aiClientStub.executeAction05).toHaveBeenCalled();
    expect(aiClientStub.executeAction06).toHaveBeenCalled();

    // Verify action execution order by checking call order
    const action01CallTime = (aiClientStub.executeAction01 as jest.Mock).mock.invocationCallOrder[0];
    const action06CallTime = (aiClientStub.executeAction06 as jest.Mock).mock.invocationCallOrder[0];
    expect(action01CallTime).toBeLessThan(action06CallTime);
  });
});