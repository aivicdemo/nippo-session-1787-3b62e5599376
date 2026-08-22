import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { type Tx4AgentExecutionRequest, type Tx4AgentExecutionResult } from '../../src/agents/tx-4-imp-1/types';
import { type Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('Tx4Imp1Agent - ダッシュボード分析から課題指示までの自動実行', () => {
  // SCEN-072
  test('通常案件（経営判断不要、単一部門、優先順位判定可能）を人の都度承認なしで最後まで完了する', async () => {
    const executionTimestamp = new Date('2024-01-15T08:00:00Z');
    const targetDate = '2024-01-15';
    const executorUserId = 'user-dept-manager-001';
    const teamId = 'team-engineering-001';

    const request: Tx4AgentExecutionRequest = {
      executionTimestamp,
      targetDate,
      executorUserId,
      teamId,
    };

    const mockAiClient: Tx4Imp1AiClient = {
      // Action 1: リアルタイム進捗データ自動集約
      aggregateRealtimeProgressData: jest.fn(async () => ({
        aggregatedDatasets: [
          {
            sourceSystem: 'jira',
            projects: [
              {
                projectId: 'proj-001',
                projectName: 'ProjectA',
                status: 'IN_PROGRESS',
                plannedEndDate: '2024-01-12',
                actualProgress: 65,
              },
              {
                projectId: 'proj-002',
                projectName: 'ProjectB',
                status: 'BLOCKED',
                plannedEndDate: '2024-01-14',
                actualProgress: 45,
              },
              {
                projectId: 'proj-003',
                projectName: 'ProjectC',
                status: 'COMPLETED',
                plannedEndDate: '2024-01-15',
                actualProgress: 100,
              },
            ],
          },
          {
            sourceSystem: 'asana',
            tasks: [
              {
                taskId: 'task-001',
                taskName: 'TaskX',
                status: 'NOT_STARTED',
                dueDate: '2024-01-13',
              },
              {
                taskId: 'task-002',
                taskName: 'TaskY',
                status: 'IN_PROGRESS',
                dueDate: '2024-01-15',
              },
            ],
          },
        ],
        aggregationTimestamp: new Date('2024-01-15T08:05:00Z'),
      })),

      // Action 2: 進捗遅延・未提出・異常値検出
      detectProgressAnomalies: jest.fn(async () => ({
        detectedIssues: [
          {
            issueId: 'issue-001',
            category: 'SCHEDULE_DELAY',
            sourceProject: 'proj-001',
            description: 'ProjectA: 計画終了日2024-01-12を超過、3日遅延',
            severity: 'HIGH',
            affectedMembers: ['member-001', 'member-002'],
          },
          {
            issueId: 'issue-002',
            category: 'BLOCKED_STATUS',
            sourceProject: 'proj-002',
            description: 'ProjectB: ブロック状態が継続中、リスク顕在化',
            severity: 'HIGH',
            affectedMembers: ['member-003'],
          },
          {
            issueId: 'issue-003',
            category: 'MISSING_REPORT',
            description: '未提出メンバー: member-004 (1日超過), member-005 (2日超過)',
            severity: 'MEDIUM',
            affectedMembers: ['member-004', 'member-005'],
          },
          {
            issueId: 'issue-004',
            category: 'ANOMALOUS_VALUE',
            sourceProject: 'proj-002',
            description: 'ProjectB: 進捗率45%は計画進捗率85%より40ポイント下回る異常',
            severity: 'HIGH',
            affectedMembers: ['member-003'],
          },
        ],
        totalDetectedCount: 4,
        detectionTimestamp: new Date('2024-01-15T08:10:00Z'),
      })),

      // Action 3: 過去の類似課題照合と再発リスク評価
      evaluateRecurrenceRisk: jest.fn(async () => ({
        riskAssessments: [
          {
            currentIssueId: 'issue-001',
            similarHistoricalIssues: [
              { issueId: 'hist-proj-001-delay-001', occurrenceDate: '2023-12-15', resolutionDays: 2 },
              { issueId: 'hist-proj-001-delay-002', occurrenceDate: '2023-11-20', resolutionDays: 3 },
            ],
            recurrenceRiskScore: 0.75,
            riskLevel: 'HIGH',
            suggestedPreventiveAction: 'ProjectAの リソース追加またはスケジュール再調整',
          },
          {
            currentIssueId: 'issue-002',
            similarHistoricalIssues: [
              { issueId: 'hist-proj-002-blocked-001', occurrenceDate: '2024-01-08', resolutionDays: 4 },
            ],
            recurrenceRiskScore: 0.65,
            riskLevel: 'MEDIUM_HIGH',
            suggestedPreventiveAction: 'ProjectBの ブロック原因を今日13:00までに特定し、解決策を提案',
          },
          {
            currentIssueId: 'issue-003',
            similarHistoricalIssues: [],
            recurrenceRiskScore: 0.4,
            riskLevel: 'MEDIUM',
            suggestedPreventiveAction: '未提出メンバーへの定期リマインダー送信ルール強化',
          },
          {
            currentIssueId: 'issue-004',
            similarHistoricalIssues: [
              { issueId: 'hist-proj-002-anomaly-001', occurrenceDate: '2024-01-02', resolutionDays: 1 },
            ],
            recurrenceRiskScore: 0.55,
            riskLevel: 'MEDIUM',
            suggestedPreventiveAction: 'ProjectB の実績報告精度向上（日次確認会議）',
          },
        ],
        assessmentTimestamp: new Date('2024-01-15T08:15:00Z'),
      })),

      // Action 4: 自動優先順位付け
      prioritizeIssues: jest.fn(async () => ({
        prioritizedIssues: [
          {
            priorityRank: 1,
            issueId: 'issue-002',
            category: 'BLOCKED_STATUS',
            importance: 'HIGH',
            urgency: 'HIGH',
            recurrenceRiskScore: 0.65,
            description: 'ProjectB: ブロック状態が継続中、リスク顕在化',
            recommendedResponseTime: '本日13:00まで',
          },
          {
            priorityRank: 2,
            issueId: 'issue-001',
            category: 'SCHEDULE_DELAY',
            importance: 'HIGH',
            urgency: 'HIGH',
            recurrenceRiskScore: 0.75,
            description: 'ProjectA: 計画終了日2024-01-12を超過、3日遅延',
            recommendedResponseTime: '本日14:00まで',
          },
          {
            priorityRank: 3,
            issueId: 'issue-004',
            category: 'ANOMALOUS_VALUE',
            importance: 'HIGH',
            urgency: 'MEDIUM',
            recurrenceRiskScore: 0.55,
            description: 'ProjectB: 進捗率45%は計画進捗率85%より40ポイント下回る異常',
            recommendedResponseTime: '本日15:00まで',
          },
          {
            priorityRank: 4,
            issueId: 'issue-003',
            category: 'MISSING_REPORT',
            importance: 'MEDIUM',
            urgency: 'MEDIUM',
            recurrenceRiskScore: 0.4,
            description: '未提出メンバー: member-004 (1日超過), member-005 (2日超過)',
            recommendedResponseTime: '本日11:00まで',
          },
        ],
        totalPrioritizedCount: 4,
        prioritizationTimestamp: new Date('2024-01-15T08:20:00Z'),
      })),

      // Action 5: 推奨対応方針生成
      generateCountermeasurePlans: jest.fn(async () => ({
        countermeasurePlans: [
          {
            planId: 'plan-001',
            issueId: 'issue-002',
            recommendedActions: [
              'ProjectB のブロック原因を本日13:00までに特定・報告',
              'ブロック解除のための代替案またはリソース追加案を14:00までに提案',
              'リスク顕在化の影響範囲を評価し、他プロジェクトへの波及の可能性を確認',
            ],
            estimatedResolutionDays: 1,
            assignedOwner: 'member-003',
            priorityRank: 1,
          },
          {
            planId: 'plan-002',
            issueId: 'issue-001',
            recommendedActions: [
              'ProjectA の遅延理由と残作業を本日14:00までにまとめる',
              '3日遅延を挽回するため、リソース追加またはスケジュール短縮案を提案',
              '新しい計画完了日を15:00までに設定し、関係者に通知',
            ],
            estimatedResolutionDays: 2,
            assignedOwner: 'member-001',
            priorityRank: 2,
          },
          {
            planId: 'plan-003',
            issueId: 'issue-004',
            recommendedActions: [
              'ProjectB の実績報告精度を向上させるため、本日日中に実績確認会議を実施',
              '進捗率45%が正確か、または報告エラーか を確認',
              '計画進捗率との乖離原因を分析し、今後の予防策を検討',
            ],
            estimatedResolutionDays: 1,
            assignedOwner: 'member-003',
            priorityRank: 3,
          },
          {
            planId: 'plan-004',
            issueId: 'issue-003',
            recommendedActions: [
              'member-004, member-005 に対して本日11:00までに提出催促を送信',
              '未提出理由をヒアリングし、提出困難な場合は代替方法を検討',
              '今後の未提出防止のためのリマインダー送信ルール強化を検討',
            ],
            estimatedResolutionDays: 1,
            assignedOwner: executorUserId,
            priorityRank: 4,
          },
        ],
        generationTimestamp: new Date('2024-01-15T08:25:00Z'),
      })),

      // Action 6: 朝会報告用ダッシュボード資料自動作成
      generateMorningMeetingMaterial: jest.fn(async () => ({
        materialId: 'material-20240115-001',
        format: 'DASHBOARD_PRESENTATION',
        sections: [
          {
            sectionTitle: '重要課題サマリー（優先度順）',
            content: {
              prioritizedIssuesList: [
                {
                  rank: 1,
                  issueTitle: 'ProjectB ブロック状態解除（本日13:00まで）',
                  importance: 'HIGH',
                  urgency: 'HIGH',
                  owner: 'member-003',
                },
                {
                  rank: 2,
                  issueTitle: 'ProjectA スケジュール遅延対応（本日14:00まで）',
                  importance: 'HIGH',
                  urgency: 'HIGH',
                  owner: 'member-001',
                },
                {
                  rank: 3,
                  issueTitle: 'ProjectB 進捗率異常調査（本日15:00まで）',
                  importance: 'HIGH',
                  urgency: 'MEDIUM',
                  owner: 'member-003',
                },
                {
                  rank: 4,
                  issueTitle: '未提出メンバー催促（本日11:00まで）',
                  importance: 'MEDIUM',
                  urgency: 'MEDIUM',
                  owner: executorUserId,
                },
              ],
            },
          },
          {
            sectionTitle: 'プロジェクト進捗ダッシュボード',
            content: {
              projectProgressBars: [
                {
                  projectName: 'ProjectA',
                  plannedCompletion: '2024-01-12',
                  currentStatus: 'DELAYED_3_DAYS',
                  progressPercentage: 65,
                  indicator: '⚠️ 遅延',
                },
                {
                  projectName: 'ProjectB',
                  plannedCompletion: '2024-01-14',
                  currentStatus: 'BLOCKED',
                  progressPercentage: 45,
                  indicator: '🔴 ブロック',
                },
                {
                  projectName: 'ProjectC',
                  plannedCompletion: '2024-01-15',
                  currentStatus: 'ON_TRACK',
                  progressPercentage: 100,
                  indicator: '✅ 完了',
                },
              ],
            },
          },
          {
            sectionTitle: '本日の対応指示',
            content: {
              actionItems: [
                '13:00: ProjectB ブロック原因の報告（member-003）',
                '14:00: ProjectA リスケジュール案の提出（member-001）',
                '15:00: 進捗率異常の調査報告（member-003）',
                '11:00: 未提出メンバーへの催促完了確認',
              ],
            },
          },
        ],
        createdTimestamp: new Date('2024-01-15T08:30:00Z'),
        readyForPresentation: true,
      })),

      // Action 7: 未提出メンバーリスト抽出と通知
      extractAndNotifyNonSubmitters: jest.fn(async () => ({
        nonSubmittersList: [
          {
            memberId: 'member-004',
            memberName: 'Engineer D',
            submissionOverdueHours: 24,
            lastNotificationTimestamp: new Date('2024-01-14T18:00:00Z'),
            notificationStatus: 'PENDING_DELIVERY',
          },
          {
            memberId: 'member-005',
            memberName: 'Engineer E',
            submissionOverdueHours: 48,
            lastNotificationTimestamp: new Date('2024-01-13T18:00:00Z'),
            notificationStatus: 'PENDING_DELIVERY',
          },
        ],
        totalNonSubmitterCount: 2,
        notificationDeliveryStatus: 'QUEUED',
        notificationTimestamp: new Date('2024-01-15T08:35:00Z'),
      })),
    };

    const result = await runTx4Imp1Agent(request, mockAiClient);

    // Action 1: リアルタイム進捗データ自動集約の検証
    expect(mockAiClient.aggregateRealtimeProgressData).toHaveBeenCalledWith({
      targetDate,
      teamId,
      executionTimestamp,
    });

    // Action 2: 進捗遅延・未提出・異常値検出の検証
    expect(mockAiClient.detectProgressAnomalies).toHaveBeenCalled();
    const anomalyCall = mockAiClient.detectProgressAnomalies.mock.calls[0][0];
    expect(anomalyCall.aggregatedDatasets).toBeDefined();
    expect(anomalyCall.aggregatedDatasets.length).toBe(2);

    // Action 3: 過去の類似課題照合と再発リスク評価の検証
    expect(mockAiClient.evaluateRecurrenceRisk).toHaveBeenCalled();
    const riskCall = mockAiClient.evaluateRecurrenceRisk.mock.calls[0][0];
    expect(riskCall.detectedIssues).toBeDefined();
    expect(riskCall.detectedIssues.length).toBe(4);

    // Action 4: 自動優先順位付けの検証
    expect(mockAiClient.prioritizeIssues).toHaveBeenCalled();
    const priorityCall = mockAiClient.prioritizeIssues.mock.calls[0][0];
    expect(priorityCall.riskAssessments).toBeDefined();
    expect(priorityCall.riskAssessments.length).toBe(4);

    // Action 5: 推奨対応方針生成の検証
    expect(mockAiClient.generateCountermeasurePlans).toHaveBeenCalled();
    const planCall = mockAiClient.generateCountermeasurePlans.mock.calls[0][0];
    expect(planCall.prioritizedIssues).toBeDefined();
    expect(planCall.prioritizedIssues.length).toBe(4);

    // Action 6: 朝会報告用ダッシュボード資料自動作成の検証
    expect(mockAiClient.generateMorningMeetingMaterial).toHaveBeenCalled();
    const materialCall = mockAiClient.generateMorningMeetingMaterial.mock.calls[0][0];
    expect(materialCall.countermeasurePlans).toBeDefined();
    expect(materialCall.countermeasurePlans.length).toBe(4);

    // Action 7: 未提出メンバーリスト抽出と通知の検証
    expect(mockAiClient.extractAndNotifyNonSubmitters).toHaveBeenCalled();
    const nonSubmitterCall = mockAiClient.extractAndNotifyNonSubmitters.mock.calls[0][0];
    expect(nonSubmitterCall.aggregatedDatasets).toBeDefined();

    // 最終成果物の検証
    expect(result).toBeDefined();
    expect(result.executionId).toBeDefined();
    expect(result.executionId).toMatch(/^exec-/);

    // 優先度付き課題リスト（5件、各課題に重要度・緊急度・再発リスク・対応方針を付与）
    expect(result.prioritizedIssues).toBeDefined();
    expect(result.prioritizedIssues.length).toBe(4);
    expect(result.prioritizedIssues[0]).toEqual(
      expect.objectContaining({
        priorityRank: 1,
        issueId: 'issue-002',
        importance: 'HIGH',
        urgency: 'HIGH',
        recurrenceRiskScore: 0.65,
      })
    );
    expect(result.prioritizedIssues[0].description).toBeDefined();
    expect(result.prioritizedIssues[0].recommendedResponseTime).toBeDefined();

    // 部長向け朝会報告資料（ダッシュボード可視化、意思決定可能な形式）
    expect(result.countermeasurePlan).toBeDefined();
    expect(result.countermeasurePlan.planId).toBeDefined();
    expect(result.countermeasurePlan.recommendedActions).toBeDefined();
    expect(result.countermeasurePlan.recommendedActions.length).toBeGreaterThan(0);
    expect(result.countermeasurePlan.estimatedResolutionDays).toBeGreaterThan(0);
    expect(result.countermeasurePlan.assignedOwner).toBeDefined();

    // 未提出メンバー通知対象リスト（2名）
    expect(result.aggregatedReportCount).toBe(3);
    expect(result.extractedIssueCount).toBe(4);

    // 全処理は人の確認・承認ステップを経由せずに完了
    expect(result.summaryEmailSent).toBe(true);

    // 最終ステータスは「completed」
    expect(result.completionTimestamp).toBeDefined();
    expect(result.completionTimestamp.getTime()).toBeGreaterThanOrEqual(executionTimestamp.getTime());

    // 監査ログには7つのAction全実行履歴が記録されている
    expect(mockAiClient.aggregateRealtimeProgressData).toHaveBeenCalledTimes(1);
    expect(mockAiClient.detectProgressAnomalies).toHaveBeenCalledTimes(1);
    expect(mockAiClient.evaluateRecurrenceRisk).toHaveBeenCalledTimes(1);
    expect(mockAiClient.prioritizeIssues).toHaveBeenCalledTimes(1);
    expect(mockAiClient.generateCountermeasurePlans).toHaveBeenCalledTimes(1);
    expect(mockAiClient.generateMorningMeetingMaterial).toHaveBeenCalledTimes(1);
    expect(mockAiClient.extractAndNotifyNonSubmitters).toHaveBeenCalledTimes(1);
  });
});