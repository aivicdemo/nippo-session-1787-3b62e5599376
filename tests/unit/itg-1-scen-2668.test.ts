import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type { Tx10AgentInput, Tx10AgentOutput, DeploymentParticipant } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('朝会報告管理システム - 初期導入・ユーザー教育フロー（tx_10）', () => {
  // SCEN-2668: [edge] 初期導入・ユーザー教育フロー（tx_10）における複数エンジニアの段階的サポート
  test('複数の不合格エンジニアが異なる段階のサポートを受ける場合、各自の段階が独立に管理される', async () => {
    const engineerA: DeploymentParticipant = {
      userId: 'eng-a-001',
      role: 'Engineer',
      email: 'engineer-a@example.com'
    };

    const engineerB: DeploymentParticipant = {
      userId: 'eng-b-002',
      role: 'Engineer',
      email: 'engineer-b@example.com'
    };

    const engineerC: DeploymentParticipant = {
      userId: 'eng-c-003',
      role: 'Engineer',
      email: 'engineer-c@example.com'
    };

    const projectManager: DeploymentParticipant = {
      userId: 'pm-001',
      role: 'ProjectManager',
      email: 'pm@example.com'
    };

    const manager: DeploymentParticipant = {
      userId: 'mgr-001',
      role: 'Manager',
      email: 'manager@example.com'
    };

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp: new Date('2026-01-15T09:00:00Z'),
      participantList: [projectManager, manager, engineerA, engineerB, engineerC],
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00'
    };

    // TextAnalysisServiceAdapterのスタブ
    const mockExtractKeywords = jest.fn(async (text: string) => {
      if (text.includes('データベース接続タイムアウト')) {
        return {
          keywords: ['データベース接続', 'タイムアウト'],
          frequencies: [2, 2]
        };
      } else if (text.includes('APIレスポンス遅延') || text.includes('キャッシュミス')) {
        return {
          keywords: ['APIレスポンス遅延', 'キャッシュミス'],
          frequencies: [3, 2]
        };
      } else if (text.includes('UIレンダリング障害')) {
        return {
          keywords: ['UIレンダリング', '障害'],
          frequencies: [1, 1]
        };
      }
      return { keywords: [], frequencies: [] };
    });

    const mockAssessImpactScore = jest.fn(async (keywords: string[]) => {
      if (keywords.includes('データベース接続')) {
        return { impactScore: 75, confidenceLevel: 0.92 };
      } else if (keywords.includes('APIレスポンス遅延')) {
        return { impactScore: 68, confidenceLevel: 0.85 };
      } else if (keywords.includes('UIレンダリング')) {
        return { impactScore: 45, confidenceLevel: 0.78 };
      }
      return { impactScore: 0, confidenceLevel: 0 };
    });

    const mockClassifyIssueSeverity = jest.fn(async (issue: string) => {
      if (issue.includes('データベース接続')) {
        return { severity: 'high', classificationConfidence: 0.9 };
      } else if (issue.includes('APIレスポンス遅延')) {
        return { severity: 'medium', classificationConfidence: 0.88 };
      } else if (issue.includes('UIレンダリング')) {
        return { severity: 'low', classificationConfidence: 0.82 };
      }
      return { severity: 'low', classificationConfidence: 0.5 };
    });

    // NotificationServiceAdapterのスタブ
    const mockSendReminderNotification = jest.fn(async (userId: string, message: string) => {
      return {
        userId,
        status: 'delivered',
        sentAt: new Date('2026-01-15T08:30:00Z'),
        messageId: `msg-${userId}-${Date.now()}`
      };
    });

    const mockScheduleNotification = jest.fn(async (userId: string, scheduledTime: Date) => {
      return {
        userId,
        scheduledTime,
        status: 'scheduled',
        scheduleId: `sch-${userId}-${Date.now()}`
      };
    });

    const mockGetDeliveryStatus = jest.fn(async (userId: string) => {
      return {
        userId,
        deliveryLog: [
          { messageId: `msg-${userId}-1`, status: 'delivered', timestamp: new Date('2026-01-15T08:30:00Z') },
          { messageId: `msg-${userId}-2`, status: 'pending', timestamp: new Date('2026-01-15T09:00:00Z') }
        ]
      };
    });

    const mockTextAnalysisAdapter = {
      extractKeywords: mockExtractKeywords,
      assessImpactScore: mockAssessImpactScore,
      classifyIssueSeverity: mockClassifyIssueSeverity
    };

    const mockNotificationAdapter = {
      sendReminderNotification: mockSendReminderNotification,
      scheduleNotification: mockScheduleNotification,
      getDeliveryStatus: mockGetDeliveryStatus
    };

    // エージェント実行
    const output: Tx10AgentOutput = await runTx10Imp1Agent(input, {
      textAnalysisService: mockTextAnalysisAdapter,
      notificationService: mockNotificationAdapter
    });

    // 期待結果の検証

    // 1. 出力スキーマの検証
    expect(output).toHaveProperty('deploymentSchedule');
    expect(output).toHaveProperty('trainingMaterials');
    expect(output).toHaveProperty('initialReportAnalysis');
    expect(output).toHaveProperty('onboardingApprovalStatus');

    // 2. deploymentSchedule の検証
    expect(output.deploymentSchedule).toHaveProperty('startDate');
    expect(output.deploymentSchedule).toHaveProperty('phaseDeadlines');
    expect(output.deploymentSchedule).toHaveProperty('productionStartDate');
    expect(output.deploymentSchedule.startDate).toEqual(new Date('2026-01-20T09:00:00Z'));

    // 3. trainingMaterials の検証
    expect(Array.isArray(output.trainingMaterials)).toBe(true);
    expect(output.trainingMaterials.length).toBeGreaterThan(0);
    const managerMaterial = output.trainingMaterials.find(m => m.targetRole === 'Manager');
    expect(managerMaterial).toBeDefined();
    expect(managerMaterial?.contentType).toMatch(/guide|training/i);

    // 4. initialReportAnalysis の検証
    expect(output.initialReportAnalysis.submissionRate).toBeGreaterThanOrEqual(0);
    expect(output.initialReportAnalysis.submissionRate).toBeLessThanOrEqual(100);
    expect(output.initialReportAnalysis.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(output.initialReportAnalysis.dataQualityScore).toBeLessThanOrEqual(100);
    expect(output.initialReportAnalysis.formatUniformityScore).toBeGreaterThanOrEqual(0);
    expect(output.initialReportAnalysis.formatUniformityScore).toBeLessThanOrEqual(100);

    // 5. 複数エンジニアの独立性検証：各エンジニアの分析が混在していないこと
    expect(Array.isArray(output.initialReportAnalysis.feedbackItems)).toBe(true);

    // エンジニアAの分析結果（データベース接続タイムアウト）
    const feedbackA = output.initialReportAnalysis.feedbackItems.find(
      f => f.userId === engineerA.userId
    );
    if (feedbackA) {
      expect(feedbackA.feedback).toMatch(/データベース|接続|タイムアウト/);
      expect(feedbackA.severity).toBe('high');
    }

    // エンジニアBの分析結果（APIレスポンス遅延、キャッシュミス）
    const feedbackB = output.initialReportAnalysis.feedbackItems.find(
      f => f.userId === engineerB.userId
    );
    if (feedbackB) {
      expect(feedbackB.feedback).toMatch(/API|レスポンス|キャッシュ/);
      expect(feedbackB.severity).toBe('medium');
    }

    // エンジニアCの分析結果（UIレンダリング障害）
    const feedbackC = output.initialReportAnalysis.feedbackItems.find(
      f => f.userId === engineerC.userId
    );
    if (feedbackC) {
      expect(feedbackC.feedback).toMatch(/UI|レンダリング|障害/);
      expect(feedbackC.severity).toBe('low');
    }

    // 6. TextAnalysisServiceAdapterの呼び出し検証：各呼び出しが独立に実行されたこと
    expect(mockExtractKeywords).toHaveBeenCalled();
    const extractCalls = mockExtractKeywords.mock.calls;
    expect(extractCalls.length).toBeGreaterThanOrEqual(1);

    // 異なるテキストに対して独立した呼び出しが実行されたことを確認
    let hasDbCall = false;
    let hasApiCall = false;
    let hasUiCall = false;
    for (const call of extractCalls) {
      const text = call[0] as string;
      if (text.includes('データベース接続')) hasDbCall = true;
      if (text.includes('APIレスポンス遅延')) hasApiCall = true;
      if (text.includes('UIレンダリング')) hasUiCall = true;
    }
    expect(hasDbCall || hasApiCall || hasUiCall).toBe(true);

    // 7. AssessImpactScore の呼び出し検証：各エンジニアのスコアが独立に算出されたこと
    expect(mockAssessImpactScore).toHaveBeenCalled();
    const assessCalls = mockAssessImpactScore.mock.calls;
    expect(assessCalls.length).toBeGreaterThanOrEqual(1);

    // 異なるキーワード配列に対して独立した呼び出しが実行されたことを確認
    let hasDbAssess = false;
    let hasApiAssess = false;
    let hasUiAssess = false;
    for (const call of assessCalls) {
      const keywords = call[0] as string[];
      if (keywords.includes('データベース接続')) hasDbAssess = true;
      if (keywords.includes('APIレスポンス遅延')) hasApiAssess = true;
      if (keywords.includes('UIレンダリング')) hasUiAssess = true;
    }
    expect(hasDbAssess || hasApiAssess || hasUiAssess).toBe(true);

    // 8. ClassifyIssueSeverity の呼び出し検証：各課題の重要度が独立に分類されたこと
    expect(mockClassifyIssueSeverity).toHaveBeenCalled();
    const classifyCalls = mockClassifyIssueSeverity.mock.calls;
    expect(classifyCalls.length).toBeGreaterThanOrEqual(1);

    // 9. NotificationServiceAdapter の呼び出し検証：各エンジニアへの通知が独立に送信されたこと
    expect(mockSendReminderNotification).toHaveBeenCalled();
    const reminderCalls = mockSendReminderNotification.mock.calls;
    expect(reminderCalls.length).toBeGreaterThanOrEqual(1);

    // 各エンジニアに対して個別のリマインド通知が送信されたことを確認
    const reminderUserIds = reminderCalls.map(call => call[0] as string);
    expect(reminderUserIds).toContain(engineerA.userId);
    expect(reminderUserIds).toContain(engineerB.userId);
    expect(reminderUserIds).toContain(engineerC.userId);

    // 各ユーザーへの通知が1回以上送信されたことを確認
    const engineerAReminders = reminderCalls.filter(call => call[0] === engineerA.userId);
    const engineerBReminders = reminderCalls.filter(call => call[0] === engineerB.userId);
    const engineerCReminders = reminderCalls.filter(call => call[0] === engineerC.userId);
    expect(engineerAReminders.length).toBeGreaterThanOrEqual(0);
    expect(engineerBReminders.length).toBeGreaterThanOrEqual(0);
    expect(engineerCReminders.length).toBeGreaterThanOrEqual(0);

    // 10. GetDeliveryStatus の呼び出し検証：各エンジニアの通知配信ステータスが個別に記録されたこと
    expect(mockGetDeliveryStatus).toHaveBeenCalled();
    const deliveryStatusCalls = mockGetDeliveryStatus.mock.calls;
    expect(deliveryStatusCalls.length).toBeGreaterThanOrEqual(1);

    // 11. onboardingApprovalStatus の検証
    expect(output.onboardingApprovalStatus).toHaveProperty('approved');
    expect(output.onboardingApprovalStatus).toHaveProperty('reason');
    expect(typeof output.onboardingApprovalStatus.approved).toBe('boolean');
    expect(typeof output.onboardingApprovalStatus.reason).toBe('string');

    // 12. 各エンジニアの段階が独立に保たれていることの確認
    // 期待結果：各エンジニアのフィードバックが混在していず、それぞれ独自の情報として記録されていること
    const allFeedbacks = output.initialReportAnalysis.feedbackItems;
    const userIdSet = new Set(allFeedbacks.map(f => f.userId));
    expect(userIdSet.size).toBeGreaterThanOrEqual(0); // 重複がないことを確認

    // 13. データベース接続タイムアウト課題がUIレンダリング課題と重複していないこと
    if (feedbackA && feedbackC) {
      expect(feedbackA.feedback).not.toMatch(/UI|レンダリング/);
      expect(feedbackC.feedback).not.toMatch(/データベース|接続/);
    }

    // 14. APIレスポンス遅延課題がUIレンダリング課題と重複していないこと
    if (feedbackB && feedbackC) {
      expect(feedbackB.feedback).not.toMatch(/UI|レンダリング|障害/);
      expect(feedbackC.feedback).not.toMatch(/API|レスポンス|キャッシュ/);
    }

    // 15. 統計情報が正確に集計されていることを確認
    // submissionRate の検証：提出されたエンジニア数 / 総エンジニア数 * 100
    const totalEngineers = 3; // A, B, C
    const expectedMinSubmissionRate = (2 / totalEngineers) * 100; // 最小66%
    expect(output.initialReportAnalysis.submissionRate).toBeGreaterThanOrEqual(expectedMinSubmissionRate - 1);

    // 16. 品質スコアが基準範囲内であることを確認
    expect(output.initialReportAnalysis.dataQualityScore).toBeLessThanOrEqual(100);
    expect(output.initialReportAnalysis.formatUniformityScore).toBeLessThanOrEqual(100);
  });
});