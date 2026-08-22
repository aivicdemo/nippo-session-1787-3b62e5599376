import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('tx-1-imp-1: 日報集約から課題優先順位付けと未提出通知までの自律実行', () => {
  let auditLogs: Array<{
    action: string;
    actionNumber: number;
    status: string;
    timestamp: string;
    agentExecutionId: string;
  }> = [];

  let emailsSent: Array<{
    to: string;
    subject: string;
    body: string;
  }> = [];

  beforeEach(() => {
    auditLogs = [];
    emailsSent = [];
  });

  afterEach(() => {
    auditLogs = [];
    emailsSent = [];
  });

  // SCEN-029: [normal] 日報集約から課題優先順位付けと未提出通知までの自律実行 AIエージェント
  test('should execute Action 6 (send director notification) with correct structure and audit trail', async () => {
    const agentExecutionId = 'agent-exec-20240115-001';
    const executionTimestamp = new Date('2024-01-15T08:30:00Z');
    const completionTimestamp = new Date('2024-01-15T08:50:00Z');
    const managerEmail = 'manager@company.jp';
    const reportDeadlineTime = '09:00';
    const morningMeetingStartTime = '09:30';
    const teamMemberIds = ['user-001', 'user-002', 'user-003', 'user-004', 'user-005'];

    const aggregatedReports = [
      {
        userId: 'user-001',
        reportContent: '昨日は機能A開発を完了。本日は機能Bのテストを実施予定。課題：テスト環境のDB接続が不安定',
        submittedAt: new Date('2024-01-15T08:15:00Z'),
      },
      {
        userId: 'user-002',
        reportContent: '顧客Xのインシデント対応中。重大度High。復旧見込み14:00',
        submittedAt: new Date('2024-01-15T08:20:00Z'),
      },
      {
        userId: 'user-003',
        reportContent: '定例タスク完了。新規課題なし',
        submittedAt: new Date('2024-01-15T08:25:00Z'),
      },
    ];

    const unsubmittedMembers = ['user-004', 'user-005'];

    const extractedIssuesAction45Result = [
      {
        issueId: 'issue-001',
        content: 'テスト環境のDB接続が不安定',
        priority: 1,
        priorityScore: 85,
        extractedFrom: 'user-001',
      },
      {
        issueId: 'issue-002',
        content: '顧客Xのインシデント対応中。重大度High',
        priority: 1,
        priorityScore: 95,
        extractedFrom: 'user-002',
      },
    ];

    const generatedReportFile = {
      filename: 'meeting-report-2024-01-15.xlsx',
      url: 'https://reports.company.jp/meeting-report-2024-01-15.xlsx',
    };

    const mockAiClient = {
      executeAction01: async () => ({
        status: 'completed',
        aggregatedReports,
      }),
      executeAction02: async () => ({
        status: 'completed',
        unsubmittedMembers,
      }),
      executeAction03: async () => ({
        status: 'completed',
        extractedIssues: extractedIssuesAction45Result,
      }),
      executeAction04: async () => ({
        status: 'completed',
        prioritizedIssues: extractedIssuesAction45Result,
      }),
      executeAction05: async () => ({
        status: 'completed',
        generatedReport: generatedReportFile,
      }),
      executeAction06: async (
        managerEmailAddr: string,
        reportFile: { filename: string; url: string },
        stats: {
          processedDate: string;
          unsubmittedCount: number;
          extractedIssueCount: number;
          generatedAt: Date;
        }
      ) => {
        const notificationBody = `
朝会資料が生成されました。

【生成完了】
ファイル: ${reportFile.filename}
URL: ${reportFile.url}
生成時刻: ${stats.generatedAt.toISOString().substring(0, 19).replace('T', ' ')}

【処理対象日付】
${stats.processedDate}

【提出状況】
未提出者数: ${stats.unsubmittedCount}名

【課題抽出結果】
抽出課題数: ${stats.extractedIssueCount}件

確認をお願いいたします。
        `;

        emailsSent.push({
          to: managerEmailAddr,
          subject: '朝会資料生成完了通知',
          body: notificationBody,
        });

        auditLogs.push({
          action: 'send_notification_to_director',
          actionNumber: 6,
          status: 'completed',
          timestamp: new Date('2024-01-15T08:50:00Z').toISOString(),
          agentExecutionId,
        });

        return {
          status: 'completed',
          sentTo: managerEmailAddr,
          notificationTimestamp: new Date('2024-01-15T08:50:00Z'),
        };
      },
    };

    const input = {
      executionTimestamp,
      reportDeadlineTime,
      morningMeetingStartTime,
      teamMemberIds,
      managerEmail,
    };

    const result = await runTx1Imp1Agent(input, mockAiClient);

    // Assertion 1: orchestrator 戻り値の構造確認
    expect(result).toHaveProperty('executionStatus');
    expect(result).toHaveProperty('aggregatedReportCount');
    expect(result).toHaveProperty('unsubmittedMemberCount');
    expect(result).toHaveProperty('extractedIssueCount');
    expect(result).toHaveProperty('prioritizedIssueList');
    expect(result).toHaveProperty('summaryEmailSent');
    expect(result).toHaveProperty('completionTimestamp');

    // Assertion 2: executionStatus が success
    expect(result.executionStatus).toBe('success');

    // Assertion 3: 集約レポート件数が正しい（3件）
    expect(result.aggregatedReportCount).toBe(3);

    // Assertion 4: 未提出メンバー数が正しい（2名）
    expect(result.unsubmittedMemberCount).toBe(2);

    // Assertion 5: 抽出課題数が正しい（2件）
    expect(result.extractedIssueCount).toBe(2);

    // Assertion 6: 優先度付き課題リストの上位5件が含まれる
    expect(result.prioritizedIssueList).toHaveLength(2);
    expect(result.prioritizedIssueList[0].priority).toBe(1);
    expect(result.prioritizedIssueList[0].priorityScore).toBe(95);
    expect(result.prioritizedIssueList[1].priority).toBe(1);
    expect(result.prioritizedIssueList[1].priorityScore).toBe(85);

    // Assertion 7: summaryEmailSent が true
    expect(result.summaryEmailSent).toBe(true);

    // Assertion 8: completionTimestamp が ISO 8601 形式の Date
    expect(result.completionTimestamp).toBeInstanceOf(Date);
    expect(result.completionTimestamp.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Assertion 9: メール送信スタブに完成通知が1件記録されている
    expect(emailsSent).toHaveLength(1);
    expect(emailsSent[0].to).toBe(managerEmail);
    expect(emailsSent[0].subject).toBe('朝会資料生成完了通知');

    // Assertion 10: メール本文に必須情報が含まれている
    expect(emailsSent[0].body).toContain('meeting-report-2024-01-15.xlsx');
    expect(emailsSent[0].body).toContain('https://reports.company.jp/meeting-report-2024-01-15.xlsx');
    expect(emailsSent[0].body).toContain('2024-01-15');
    expect(emailsSent[0].body).toContain('未提出者数: 2名');
    expect(emailsSent[0].body).toContain('抽出課題数: 2件');

    // Assertion 11: 監査ログにアクション6が記録されている
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].action).toBe('send_notification_to_director');
    expect(auditLogs[0].actionNumber).toBe(6);
    expect(auditLogs[0].status).toBe('completed');
    expect(auditLogs[0].agentExecutionId).toBe(agentExecutionId);
    expect(auditLogs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Assertion 12: 前のアクション結果が失われていない（Action 1～5の処理結果が保持される）
    // これは result に集約レポート数、未提出者数、抽出課題数が含まれていることで検証される
    expect(result.aggregatedReportCount).toBeGreaterThan(0);
    expect(result.extractedIssueCount).toBeGreaterThan(0);
    expect(result.prioritizedIssueList.length).toBeGreaterThan(0);
  });
});