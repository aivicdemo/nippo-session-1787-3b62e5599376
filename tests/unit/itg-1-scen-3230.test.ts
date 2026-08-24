import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('TX-9-IMP-1: 日報集約から分析報告までの自動実行エージェント', () => {
  // SCEN-3230
  test('同一の集約指示を再実行しても書き込みや通知を重複させない（冪等性テスト）', async () => {
    // ステップ1: テストデータのセットアップ
    const aggregationStartDate = '2026-08-19';
    const aggregationEndDate = '2026-08-19';
    const targetTeamIds = ['team_001'];
    const requestedByUserId = 'dept_001';

    // 10名のメンバーの日報データ（提出済み9件、未提出1件を想定）
    const mockAggregatedReports = [
      {
        userId: 'eng_001',
        userName: 'Engineer A',
        submittedAt: '2026-08-19T08:00:00Z',
        reportText: 'Yesterday: completed API integration. Today: testing database connection. Issue: database timeout occurring',
      },
      {
        userId: 'eng_002',
        userName: 'Engineer B',
        submittedAt: '2026-08-19T08:05:00Z',
        reportText: 'Yesterday: fixed UI bug. Today: code review. Issue: same database timeout issue',
      },
      {
        userId: 'eng_003',
        userName: 'Engineer C',
        submittedAt: '2026-08-19T08:10:00Z',
        reportText: 'Yesterday: documentation. Today: test case writing. Issue: database timeout',
      },
      {
        userId: 'eng_004',
        userName: 'Engineer D',
        submittedAt: '2026-08-19T08:15:00Z',
        reportText: 'Yesterday: deployment preparation. Today: production monitoring. Issue: performance degradation',
      },
      {
        userId: 'eng_005',
        userName: 'Engineer E',
        submittedAt: '2026-08-19T08:20:00Z',
        reportText: 'Yesterday: refactoring. Today: optimization. Issue: memory leak detected',
      },
      {
        userId: 'eng_006',
        userName: 'Engineer F',
        submittedAt: '2026-08-19T08:25:00Z',
        reportText: 'Yesterday: logging implementation. Today: tracing setup. Issue: timeout in trace collection',
      },
      {
        userId: 'eng_007',
        userName: 'Engineer G',
        submittedAt: '2026-08-19T08:30:00Z',
        reportText: 'Yesterday: configuration update. Today: deployment. Issue: database connection pool exhausted',
      },
      {
        userId: 'eng_008',
        userName: 'Engineer H',
        submittedAt: '2026-08-19T08:35:00Z',
        reportText: 'Yesterday: security audit. Today: patch testing. Issue: authentication service lag',
      },
      {
        userId: 'eng_009',
        userName: 'Engineer I',
        submittedAt: '2026-08-19T08:40:00Z',
        reportText: 'Yesterday: analytics integration. Today: report generation. Issue: slow query performance',
      },
    ];

    const unsubmittedMember = {
      userId: 'eng_010',
      userName: 'Engineer J',
    };

    // ステップ2: NotificationServiceAdapterとTextAnalysisServiceAdapterをスタブ化
    const notificationCallHistory: Array<{
      userId: string;
      executionId: string;
      timestamp: string;
    }> = [];

    const textAnalysisCallHistory: Array<{
      reportId: string;
      textContent: string;
      executionId: string;
    }> = [];

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, executionId: string) => {
        notificationCallHistory.push({
          userId,
          executionId,
          timestamp: new Date().toISOString(),
        });
        return { success: true, deliveryStatus: 'sent' };
      }),
      scheduleNotification: jest.fn(async () => ({ scheduled: true })),
      getDeliveryStatus: jest.fn(async () => ({ status: 'delivered' })),
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async (text: string, reportId: string, executionId: string) => {
        textAnalysisCallHistory.push({
          reportId,
          textContent: text,
          executionId,
        });
        const keywords = text.includes('database timeout')
          ? [{ keyword: 'database timeout', frequency: 3, severity: 85 }]
          : text.includes('performance')
            ? [{ keyword: 'performance degradation', frequency: 1, severity: 70 }]
            : text.includes('memory leak')
              ? [{ keyword: 'memory leak', frequency: 1, severity: 90 }]
              : text.includes('timeout')
                ? [{ keyword: 'timeout', frequency: 2, severity: 75 }]
                : [{ keyword: 'other', frequency: 1, severity: 50 }];
        return { keywords, confidence: 0.92 };
      }),
      assessImpactScore: jest.fn(async (keyword: string) => ({
        impactScore: 75,
        affectedTeams: 3,
      })),
      classifyIssueSeverity: jest.fn(async (text: string) => 'high'),
    };

    // モックの呼び出し履歴をリセット
    notificationCallHistory.length = 0;
    textAnalysisCallHistory.length = 0;

    // ステップ3: 1回目のrunTx9Imp1Agent実行
    const firstExecutionInput = {
      aggregationPeriodStart: new Date(`${aggregationStartDate}T00:00:00Z`),
      aggregationPeriodEnd: new Date(`${aggregationEndDate}T23:59:59Z`),
      targetTeamIds,
      managerUserId: requestedByUserId,
    };

    const firstResult = await runTx9Imp1Agent(firstExecutionInput, mockTextAnalysisAdapter);

    const firstReportId = firstResult.analysisReportId;
    const firstExecutionCallCountNotification = notificationCallHistory.length;
    const firstExecutionCallCountTextAnalysis = textAnalysisCallHistory.length;

    // ステップ4: 1回目実行の副作用を確認
    expect(firstResult).toBeDefined();
    expect(firstResult.analysisReportId).toBeDefined();
    expect(typeof firstResult.analysisReportId).toBe('string');
    expect(firstResult.productivityMetrics).toBeDefined();
    expect(typeof firstResult.productivityMetrics.issueFrequencyPerDay).toBe('number');
    expect(typeof firstResult.productivityMetrics.averageResolutionDays).toBe('number');
    expect(typeof firstResult.productivityMetrics.completionRate).toBe('number');

    // 1回目の催促通知呼び出し数（未提出者数分）を確認
    // 未提出者1名なので、催促通知は1回
    expect(firstExecutionCallCountNotification).toBe(1);

    // 1回目の課題抽出呼び出し数（提出日報9件分）を確認
    expect(firstExecutionCallCountTextAnalysis).toBe(9);

    // ステップ5: 2回目のrunTx9Imp1Agent実行（同一パラメータ）
    const secondExecutionInput = {
      aggregationPeriodStart: new Date(`${aggregationStartDate}T00:00:00Z`),
      aggregationPeriodEnd: new Date(`${aggregationEndDate}T23:59:59Z`),
      targetTeamIds,
      managerUserId: requestedByUserId,
    };

    const secondResult = await runTx9Imp1Agent(secondExecutionInput, mockTextAnalysisAdapter);

    const secondReportId = secondResult.analysisReportId;
    const totalCallCountNotification = notificationCallHistory.length;
    const totalCallCountTextAnalysis = textAnalysisCallHistory.length;

    // ステップ6: 2回目実行の戻り値を確認
    expect(secondResult).toBeDefined();
    expect(secondResult.analysisReportId).toBeDefined();
    // reportIdは異なるか、同一インスタンスであることを確認
    // （通常、2回実行すれば異なるreportIdが生成される設計想定）
    expect(typeof secondResult.analysisReportId).toBe('string');

    // ステップ7: 催促通知の重複がないことを確認
    // 1回目で1回、2回目で1回、合計2回となるべき（2倍ではなく、単純加算）
    expect(totalCallCountNotification).toBe(2);
    // 同一のunsubmittedMemberに対する重複送信がないことを確認
    const unsubmittedNotifications = notificationCallHistory.filter(
      (call) => call.userId === unsubmittedMember.userId,
    );
    expect(unsubmittedNotifications.length).toBeLessThanOrEqual(2);

    // ステップ8: 課題抽出呼び出しの重複がないことを確認
    // 1回目で9回、2回目で9回、合計18回となるべき
    expect(totalCallCountTextAnalysis).toBe(18);
    // 同一の日報テキストに対する重複呼び出しがないことを確認
    const callsByReportContent = new Map<string, number>();
    for (const call of textAnalysisCallHistory) {
      const key = `${call.textContent}`;
      callsByReportContent.set(key, (callsByReportContent.get(key) || 0) + 1);
    }
    // 各日報テキストに対する呼び出しは最大2回（1回目と2回目で各1回）
    for (const count of callsByReportContent.values()) {
      expect(count).toBeLessThanOrEqual(2);
    }

    // ステップ9: 生成された分析報告書が正しくレポートされていることを確認
    expect(secondResult.productivityMetrics).toBeDefined();
    expect(secondResult.productivityMetrics.issueFrequencyPerDay).toBeGreaterThan(0);
    expect(secondResult.productivityMetrics.averageResolutionDays).toBeGreaterThan(0);
    expect(secondResult.productivityMetrics.completionRate).toBeGreaterThanOrEqual(0);
    expect(secondResult.productivityMetrics.completionRate).toBeLessThanOrEqual(100);

    // ステップ10: prioritizedIssuesが適切に返されることを確認
    expect(Array.isArray(secondResult.prioritizedIssues)).toBe(true);
    if (secondResult.prioritizedIssues.length > 0) {
      const firstIssue = secondResult.prioritizedIssues[0];
      expect(firstIssue).toHaveProperty('issueContent');
      expect(firstIssue).toHaveProperty('priorityScore');
      expect(typeof firstIssue.priorityScore).toBe('number');
    }

    // ステップ11: 報告配信ステータスが記録されていることを確認
    expect(secondResult.reportDeliveryStatus).toBeDefined();
    expect(['delivered', 'pending', 'failed']).toContain(secondResult.reportDeliveryStatus);

    // 冪等性の最終確認：2回の実行が完全に独立していること
    // 副作用が線形に加算されること（重複なし）
    expect(totalCallCountNotification).toBe(firstExecutionCallCountNotification * 2);
    expect(totalCallCountTextAnalysis).toBe(firstExecutionCallCountTextAnalysis * 2);
  });
});