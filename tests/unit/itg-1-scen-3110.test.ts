import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import type { Tx2Imp1AgentInput, Tx2Imp1AgentOutput } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('tx-2-imp-1: 日報収集から課題抽出・配信までの自律実行 - 冪等性テスト', () => {
  // SCEN-3110
  test('同一リクエストの再実行時に書き込みと通知の重複が発生しないこと', async () => {
    // ============================================================================
    // セットアップ: Fake AI Client の構築
    // ============================================================================
    const extractedKeywords = [
      { keyword: 'データベース接続エラー', frequency: 3, impactScore: 85 },
      { keyword: 'API レスポンス遅延', frequency: 2, impactScore: 60 },
      { keyword: 'メモリリーク', frequency: 1, impactScore: 75 }
    ];

    const mailSendLog: Array<{
      messageId: string;
      sentAt: Date;
      recipientId: string;
      subject: string;
      bodySnippet: string;
    }> = [];

    const extractKeywordsCallLog: Array<{
      callCount: number;
      input: string;
      returnedKeywords: typeof extractedKeywords;
    }> = [];

    const classifyIssueSeverityCallLog: Array<{
      callCount: number;
      input: string;
      classification: string;
    }> = [];

    let extractKeywordsInvokeCount = 0;
    let classifyIssueSeverityInvokeCount = 0;

    const fakeAiClient = {
      action01_AggregateSubmittedReports: async () => ({
        submittedCount: 10,
        unsubmittedCount: 0,
        reportDataList: [
          { memberId: 'M001', memberName: 'Alice', yesterdayTask: '前日タスク1', todayPlan: '本日計画1', challenges: 'データベース接続エラー が発生' },
          { memberId: 'M002', memberName: 'Bob', yesterdayTask: '前日タスク2', todayPlan: '本日計画2', challenges: 'データベース接続エラー 対応中' },
          { memberId: 'M003', memberName: 'Charlie', yesterdayTask: '前日タスク3', todayPlan: '本日計画3', challenges: 'API レスポンス遅延 が改善されない' },
          { memberId: 'M004', memberName: 'David', yesterdayTask: '前日タスク4', todayPlan: '本日計画4', challenges: 'データベース接続エラー が戻った' },
          { memberId: 'M005', memberName: 'Eve', yesterdayTask: '前日タスク5', todayPlan: '本日計画5', challenges: 'メモリリーク 検出' },
          { memberId: 'M006', memberName: 'Frank', yesterdayTask: '前日タスク6', todayPlan: '本日計画6', challenges: 'API レスポンス遅延 継続中' },
          { memberId: 'M007', memberName: 'Grace', yesterdayTask: '前日タスク7', todayPlan: '本日計画7', challenges: '特に課題なし' },
          { memberId: 'M008', memberName: 'Henry', yesterdayTask: '前日タスク8', todayPlan: '本日計画8', challenges: '特に課題なし' },
          { memberId: 'M009', memberName: 'Iris', yesterdayTask: '前日タスク9', todayPlan: '本日計画9', challenges: '特に課題なし' },
          { memberId: 'M010', memberName: 'Jack', yesterdayTask: '前日タスク10', todayPlan: '本日計画10', challenges: '特に課題なし' }
        ]
      }),

      action02_UnifyReportFormat: async (aggregated: any) => ({
        ...aggregated,
        unifiedFormat: true
      }),

      action03_ExtractAndAnalyzeChallenges: async (unified: any) => {
        extractKeywordsInvokeCount += 1;
        extractKeywordsCallLog.push({
          callCount: extractKeywordsInvokeCount,
          input: unified.reportDataList.map((r: any) => r.challenges).join(' '),
          returnedKeywords: extractedKeywords
        });
        return {
          extractedIssues: extractedKeywords.map(k => ({
            keyword: k.keyword,
            frequency: k.frequency,
            impactScore: k.impactScore,
            severity: k.impactScore >= 75 ? 'HIGH' : k.impactScore >= 60 ? 'MEDIUM' : 'LOW'
          }))
        };
      },

      action04_PrioritizeAndColorCode: async (extracted: any) => {
        classifyIssueSeverityInvokeCount += 1;
        classifyIssueSeverityCallLog.push({
          callCount: classifyIssueSeverityInvokeCount,
          input: extracted.extractedIssues.map((i: any) => i.keyword).join(','),
          classification: 'COMPLETE'
        });
        return {
          prioritizedIssues: extracted.extractedIssues
            .sort((a: any, b: any) => b.impactScore - a.impactScore)
            .map((issue: any, idx: number) => ({
              rank: idx + 1,
              keyword: issue.keyword,
              frequency: issue.frequency,
              impactScore: issue.impactScore,
              severity: issue.severity,
              colorCode: issue.severity === 'HIGH' ? '#FF0000' : issue.severity === 'MEDIUM' ? '#FFFF00' : '#00FF00'
            }))
        };
      },

      action05_GenerateConfirmationEmail: async (prioritized: any) => {
        const messageId = `MSG-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const now = new Date('2024-01-15T09:00:00Z');
        const subject = '朝会報告集約と課題優先度の自動分析完了';
        const bodySnippet = `優先度順課題:${prioritized.prioritizedIssues.map((i: any) => i.keyword).join(',')}`;

        return {
          messageId,
          subject,
          bodySnippet,
          recipientId: 'MGR001',
          sentAt: now
        };
      },

      action06_SendConfirmationEmail: async (emailData: any) => {
        mailSendLog.push({
          messageId: emailData.messageId,
          sentAt: emailData.sentAt,
          recipientId: emailData.recipientId,
          subject: emailData.subject,
          bodySnippet: emailData.bodySnippet
        });
        return {
          success: true,
          messageId: emailData.messageId
        };
      }
    };

    // ============================================================================
    // 第1回実行: 初期実行でのデータ記録
    // ============================================================================
    const input: Tx2Imp1AgentInput = {
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
      reportDeadlineTime: new Date('2024-01-15T09:30:00Z'),
      targetTeamIds: ['TEAM001'],
      managerUserIds: ['MGR001']
    };

    const firstRunOutput = await runTx2Imp1Agent(input, fakeAiClient as any);

    // 第1回実行の結果を検証
    expect(firstRunOutput).toBeDefined();
    expect(firstRunOutput.aggregatedReportCount).toBe(10);
    expect(firstRunOutput.extractedIssueCount).toBe(3);
    expect(firstRunOutput.prioritizedIssues).toHaveLength(3);
    expect(firstRunOutput.prioritizedIssues[0].keyword).toBe('データベース接続エラー');
    expect(firstRunOutput.prioritizedIssues[0].impactScore).toBe(85);
    expect(firstRunOutput.confirmationEmailSent).toBe(true);

    // メール送信ログのスナップショット保存
    const firstRunMailSnapshot = JSON.parse(JSON.stringify(mailSendLog));
    const firstRunExtractKeywordsCount = extractKeywordsInvokeCount;
    const firstRunClassifyCount = classifyIssueSeverityInvokeCount;

    expect(firstRunMailSnapshot).toHaveLength(1);
    expect(firstRunMailSnapshot[0].recipientId).toBe('MGR001');
    expect(firstRunMailSnapshot[0].subject).toBe('朝会報告集約と課題優先度の自動分析完了');
    expect(firstRunExtractKeywordsCount).toBe(1);
    expect(firstRunClassifyCount).toBe(1);

    // ============================================================================
    // 第2回実行: 同一リクエスト（冪等性テスト）
    // ============================================================================
    const secondRunOutput = await runTx2Imp1Agent(input, fakeAiClient as any);

    // 第2回実行の結果を検証
    expect(secondRunOutput).toBeDefined();
    expect(secondRunOutput.aggregatedReportCount).toBe(10);
    expect(secondRunOutput.extractedIssueCount).toBe(3);
    expect(secondRunOutput.confirmationEmailSent).toBe(true);

    // ============================================================================
    // 冪等性検証: メール送信の重複防止
    // ============================================================================
    // 第2回実行後、新たなメール記録が追加されていないことを確認
    expect(mailSendLog).toHaveLength(1);
    expect(mailSendLog[0]).toEqual(firstRunMailSnapshot[0]);

    // ============================================================================
    // 冪等性検証: AI クライアント呼び出しの重複防止
    // ============================================================================
    // 第2回実行後、extractKeywords と classifyIssueSeverity の呼び出し回数を確認
    // 第1回で1回、第2回でも1回となり、計2回
    expect(extractKeywordsInvokeCount).toBe(firstRunExtractKeywordsCount + 1);
    expect(classifyIssueSeverityInvokeCount).toBe(firstRunClassifyCount + 1);

    // ただし、どちらの実行でも同じキーワードと分類結果が返されることを確認
    expect(extractKeywordsCallLog[0].returnedKeywords).toEqual(extractKeywordsCallLog[1].returnedKeywords);
    expect(classifyIssueSeverityCallLog[0].classification).toBe(classifyIssueSeverityCallLog[1].classification);

    // ============================================================================
    // 冪等性検証: 優先度スコアの一貫性
    // ============================================================================
    const firstRunPrioritizedIssues = firstRunOutput.prioritizedIssues;
    const secondRunPrioritizedIssues = secondRunOutput.prioritizedIssues;

    expect(secondRunPrioritizedIssues).toHaveLength(firstRunPrioritizedIssues.length);
    for (let i = 0; i < firstRunPrioritizedIssues.length; i++) {
      expect(secondRunPrioritizedIssues[i].keyword).toBe(firstRunPrioritizedIssues[i].keyword);
      expect(secondRunPrioritizedIssues[i].impactScore).toBe(firstRunPrioritizedIssues[i].impactScore);
      expect(secondRunPrioritizedIssues[i].frequency).toBe(firstRunPrioritizedIssues[i].frequency);
    }
  });
});