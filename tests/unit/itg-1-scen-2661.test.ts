import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type { Tx10AgentInput, Tx10AgentOutput, DeploymentParticipant, InitialReportAnalysisResult } from '../../src/agents/tx-10-imp-1/types';

describe('朝会報告管理システム - 初期導入・ユーザー教育フロー tx_10', () => {
  // SCEN-2661: [edge] 初期導入・ユーザー教育フロー（tx_10）における再教育判定機能 - 報告形式の不適合判定スコアが100（最大値）の場合、不合格と判定される
  test('報告形式の不適合判定スコアが100の場合、再教育判定機能は該当ユーザーを不合格と判定し再教育フローを開始する', async () => {
    const deploymentInitiationTimestamp = new Date('2024-01-15T09:00:00Z');
    const reportingDeadlineTime = '09:00';
    const preparationDaysRequired = 5;

    const participantList: DeploymentParticipant[] = [
      {
        userId: 'pm-001',
        role: 'ProjectManager',
        email: 'pm001@company.com'
      },
      {
        userId: 'mgr-001',
        role: 'Manager',
        email: 'mgr001@company.com'
      },
      {
        userId: 'eng-001',
        role: 'Engineer',
        email: 'eng001@company.com'
      },
      {
        userId: 'eng-002',
        role: 'Engineer',
        email: 'eng002@company.com'
      },
      {
        userId: 'eng-003',
        role: 'Engineer',
        email: 'eng003@company.com'
      },
      {
        userId: 'eng-004',
        role: 'Engineer',
        email: 'eng004@company.com'
      },
      {
        userId: 'eng-005',
        role: 'Engineer',
        email: 'eng005@company.com'
      },
      {
        userId: 'eng-006',
        role: 'Engineer',
        email: 'eng006@company.com'
      },
      {
        userId: 'eng-007',
        role: 'Engineer',
        email: 'eng007@company.com'
      },
      {
        userId: 'eng-008',
        role: 'Engineer',
        email: 'eng008@company.com'
      },
      {
        userId: 'eng-009',
        role: 'Engineer',
        email: 'eng009@company.com'
      },
      {
        userId: 'eng-010',
        role: 'Engineer',
        email: 'eng010@company.com'
      }
    ];

    const mockAiClient = {
      assessFormatUniformityScore: jest.fn().mockResolvedValue({
        formatUniformityScore: 100,
        userId: 'eng-001',
        details: 'Report format does not comply with required standards'
      }),
      assessDataQualityScore: jest.fn().mockResolvedValue({
        dataQualityScore: 85,
        userId: 'eng-001'
      }),
      calculateSubmissionRate: jest.fn().mockResolvedValue({
        submissionRate: 100
      }),
      generateFeedbackItems: jest.fn().mockResolvedValue({
        feedbackItems: [
          {
            userId: 'eng-001',
            feedbackType: 'format_non_compliance',
            message: 'Report format must follow the standard template with three mandatory sections',
            actionRequired: true
          }
        ]
      }),
      validateOnboardingApprovalStatus: jest.fn().mockResolvedValue({
        canApprove: false,
        requiresRetraining: true,
        approvalReason: 'Format compliance score below acceptable threshold'
      })
    };

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime
    };

    const output: Tx10AgentOutput = await runTx10Imp1Agent(input, mockAiClient);

    expect(output).toBeDefined();
    expect(output.initialReportAnalysis).toBeDefined();
    expect(output.initialReportAnalysis.formatUniformityScore).toBe(100);
    expect(output.initialReportAnalysis.feedbackItems).toBeDefined();
    expect(output.initialReportAnalysis.feedbackItems.length).toBeGreaterThan(0);

    const retrainingFeedback = output.initialReportAnalysis.feedbackItems.find(
      (item) => item.userId === 'eng-001' && item.actionRequired === true
    );
    expect(retrainingFeedback).toBeDefined();
    expect(retrainingFeedback?.feedbackType).toBe('format_non_compliance');

    expect(output.onboardingApprovalStatus).toBeDefined();
    expect(output.onboardingApprovalStatus.isApproved).toBe(false);
    expect(output.onboardingApprovalStatus.requiresRetraining).toBe(true);

    expect(mockAiClient.assessFormatUniformityScore).toHaveBeenCalled();
    expect(mockAiClient.generateFeedbackItems).toHaveBeenCalled();
  });
});