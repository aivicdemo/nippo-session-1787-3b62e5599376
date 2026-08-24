import { type Tx10Imp1AiClient } from "../../src/agents/tx-10-imp-1/orchestrator";
import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from '../../src/agents/tx-10-imp-1/prompts/action-03';
import type { Tx10AgentInput, Tx10AgentOutput, DeploymentParticipant } from '../../src/agents/tx-10-imp-1/types';

describe('Tx10Imp1Agent - 導入計画・研修実施・フィードバック対応の自動化・統合', () => {
  // SCEN-180
  test('should execute Action 3 to generate engineer training materials and implementation plan with AIVIC scope compliance', async () => {
    // Setup: Test department information - 10 engineers, no reporting system deployed
    const deploymentInitiationTimestamp = new Date('2024-01-15T09:00:00Z');
    const participants: DeploymentParticipant[] = [
      { userId: 'ENG001', role: 'Engineer', email: 'eng001@example.com' },
      { userId: 'ENG002', role: 'Engineer', email: 'eng002@example.com' },
      { userId: 'ENG003', role: 'Engineer', email: 'eng003@example.com' },
      { userId: 'ENG004', role: 'Engineer', email: 'eng004@example.com' },
      { userId: 'ENG005', role: 'Engineer', email: 'eng005@example.com' },
      { userId: 'ENG006', role: 'Engineer', email: 'eng006@example.com' },
      { userId: 'ENG007', role: 'Engineer', email: 'eng007@example.com' },
      { userId: 'ENG008', role: 'Engineer', email: 'eng008@example.com' },
      { userId: 'ENG009', role: 'Engineer', email: 'eng009@example.com' },
      { userId: 'ENG010', role: 'Engineer', email: 'eng010@example.com' },
      { userId: 'MGR001', role: 'Manager', email: 'manager@example.com' },
      { userId: 'PM001', role: 'ProjectManager', email: 'pm@example.com' },
    ];

    const testInput: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList: participants,
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    // Setup: Mock AI client that handles Action 3 prompt
    const mockAiClient: Tx10Imp1AiClient = {
      invokeAction: async (action: string, prompt: string) => {
        if (action === 'action-03') {
          // Verify that buildAction03Prompt was called correctly
          expect(ACTION_03_PROMPT_VERSION).toBeDefined();
          expect(typeof ACTION_03_PROMPT_VERSION).toBe('string');

          // Verify prompt structure contains key information
          expect(prompt).toContain('research');
          expect(prompt).toContain('engineer');
          expect(prompt).toContain('training');

          // Return mock training materials response that respects AIVIC scope
          return {
            trainingMaterials: [
              {
                contentType: 'engineer-training-materials',
                title: 'エンジニア向け朝会報告システム操作ガイド',
                sections: [
                  {
                    heading: 'ログイン手順',
                    description: 'ユーザーIDとパスワードを入力して、朝会報告システムにログインします。',
                    steps: [
                      '朝会報告アプリを起動する',
                      'ユーザーID、パスワードを入力',
                      'ログインボタンを押す',
                    ],
                  },
                  {
                    heading: '日報入力方法',
                    description: '3つの項目を入力して、朝会報告を完成させます。',
                    items: [
                      {
                        label: '昨日やったこと',
                        placeholder: '前日に実施した作業内容を記入',
                        type: 'textarea',
                      },
                      {
                        label: '今日やること',
                        placeholder: '本日の予定・予定している作業を記入',
                        type: 'textarea',
                      },
                      {
                        label: '抱えている課題',
                        placeholder: '現在対応中の課題や懸念事項を記入',
                        type: 'textarea',
                      },
                    ],
                  },
                  {
                    heading: '送信ボタン操作',
                    description: '入力完了後、送信ボタンを押して報告を提出します。',
                    steps: [
                      '3項目すべての入力を確認',
                      '送信ボタンをクリック',
                      '送信完了メッセージを確認',
                    ],
                  },
                ],
                estimatedDuration: '45-60',
                outputFormat: 'PDF',
                scope: 'AIVIC-core',
                excludedFeatures: [
                  'multi-report-simultaneous-send',
                  'multi-department-routing',
                  'advanced-analytics',
                ],
              },
            ],
            implementationPlan: {
              trainingTargetCount: 10,
              estimatedDurationMinutes: 50,
              scheduleCandidates: [
                {
                  date: '2024-01-22',
                  timeSlot: '14:00-15:00',
                  reason: 'Post-lunch afternoon session',
                },
                {
                  date: '2024-01-23',
                  timeSlot: '10:00-11:00',
                  reason: 'Morning slot before daily standup',
                },
                {
                  date: '2024-01-24',
                  timeSlot: '15:00-16:00',
                  reason: 'End-of-day flexible session',
                },
              ],
              environmentRequirements: {
                terminalCount: 10,
                networkBandwidth: '10 Mbps minimum',
                browserRequirement: 'Chrome/Firefox/Safari latest',
                accessibleFrom: 'office-network-and-vpn',
              },
            },
          };
        }
        throw new Error(`Unknown action: ${action}`);
      },
    };

    // Execute: Call runTx10Imp1Agent with mocked AI client
    const result: Tx10AgentOutput = await runTx10Imp1Agent(testInput, mockAiClient);

    // Verify: Training materials contain required AIVIC-scope sections
    expect(result.trainingMaterials).toBeDefined();
    expect(result.trainingMaterials.length).toBeGreaterThan(0);

    const engineerMaterial = result.trainingMaterials.find(
      (m) => m.contentType === 'engineer-training-materials'
    );
    expect(engineerMaterial).toBeDefined();
    expect(engineerMaterial?.title).toContain('エンジニア向け');

    // Verify: Section structure contains all required elements
    const sections = engineerMaterial?.sections || [];
    const sectionHeadings = sections.map((s) => s.heading);

    expect(sectionHeadings).toContain('ログイン手順');
    expect(sectionHeadings).toContain('日報入力方法');
    expect(sectionHeadings).toContain('送信ボタン操作');

    // Verify: Login section contains correct steps
    const loginSection = sections.find((s) => s.heading === 'ログイン手順');
    expect(loginSection?.steps).toContain('ユーザーID、パスワードを入力');
    expect(loginSection?.steps).toContain('ログインボタンを押す');

    // Verify: Report input section contains all 3 required items
    const reportInputSection = sections.find((s) => s.heading === '日報入力方法');
    const reportItems = reportInputSection?.items || [];
    expect(reportItems.length).toBe(3);

    const itemLabels = reportItems.map((i) => i.label);
    expect(itemLabels).toContain('昨日やったこと');
    expect(itemLabels).toContain('今日やること');
    expect(itemLabels).toContain('抱えている課題');

    // Verify: Send button section contains correct steps
    const sendSection = sections.find((s) => s.heading === '送信ボタン操作');
    expect(sendSection?.steps).toContain('送信ボタンをクリック');

    // Verify: AIVIC scope compliance - excluded features must be absent from material
    expect(engineerMaterial?.scope).toBe('AIVIC-core');
    expect(engineerMaterial?.excludedFeatures).toContain('multi-report-simultaneous-send');
    expect(engineerMaterial?.excludedFeatures).toContain('multi-department-routing');
    expect(engineerMaterial?.excludedFeatures).toContain('advanced-analytics');

    // Verify: Training materials do not contain advanced features
    const materialContent = JSON.stringify(engineerMaterial);
    expect(materialContent).not.toContain('複数報告の同時送信');
    expect(materialContent).not.toContain('複数部門への振り分け');
    expect(materialContent).not.toContain('分析機能');

    // Verify: Output format is suitable for manager pre-review
    expect(engineerMaterial?.outputFormat).toBe('PDF');

    // Verify: Implementation plan contains required information
    expect(result.implementationPlan).toBeDefined();
    const plan = result.implementationPlan;

    expect(plan.deploymentSchedule).toBeDefined();
    expect(plan.trainingMaterials).toBeDefined();
    expect(plan.initialReportAnalysis).toBeDefined();
    expect(plan.onboardingApprovalStatus).toBeDefined();

    // Verify: Training target count matches participant count
    expect(plan.trainingMaterials[0]?.trainingTargetCount).toBe(10);

    // Verify: Estimated duration is reasonable for AIVIC scope (3 items only)
    expect(plan.trainingMaterials[0]?.estimatedDurationMinutes).toBeLessThanOrEqual(60);
    expect(plan.trainingMaterials[0]?.estimatedDurationMinutes).toBeGreaterThanOrEqual(30);

    // Verify: Schedule candidates are provided with rationale
    const schedules = plan.trainingMaterials[0]?.scheduleCandidates || [];
    expect(schedules.length).toBeGreaterThan(0);

    schedules.forEach((schedule) => {
      expect(schedule.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(schedule.timeSlot).toMatch(/^\d{2}:\d{2}-\d{2}:\d{2}$/);
      expect(schedule.reason).toBeDefined();
    });

    // Verify: Environment requirements specify all necessary information
    const envReqs = plan.trainingMaterials[0]?.environmentRequirements;
    expect(envReqs).toBeDefined();
    expect(envReqs?.terminalCount).toBe(10);
    expect(envReqs?.networkBandwidth).toBeDefined();
    expect(envReqs?.browserRequirement).toBeDefined();
    expect(envReqs?.accessibleFrom).toBeDefined();

    // Verify: ACTION_03_PROMPT_VERSION is properly exported
    expect(ACTION_03_PROMPT_VERSION).toBeTruthy();
    expect(typeof ACTION_03_PROMPT_VERSION).toBe('string');
    expect(ACTION_03_PROMPT_VERSION.length).toBeGreaterThan(0);

    // Verify: Orchestrator boundary - second parameter matches Tx10Imp1AiClient interface
    expect(typeof mockAiClient.invokeAction).toBe('function');

    // Verify: buildAction03Prompt exports correctly
    const action03Prompt = buildAction03Prompt({
      participantCount: 10,
      deploymentScope: 'AIVIC',
      estimatedDurationHours: 1,
    });
    expect(action03Prompt).toBeDefined();
    expect(typeof action03Prompt).toBe('string');
    expect(action03Prompt.length).toBeGreaterThan(0);
    expect(action03Prompt).toContain('training');
  });
});