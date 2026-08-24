import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput, type DeploymentParticipant, type InitialReportAnalysisResult } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('朝会報告初期導入エージェント - 形式統一度計算端数処理', () => {
  // SCEN-2623: [edge] 初回テスト運用判定機能 - 形式統一度計算で端数が生じたとき適切に丸められる
  test('形式統一度計算で小数点以下の端数が発生した場合、定義された丸めルールに従って処理され、複数回の計算実行において一貫性のある整数値またはN桁小数値として出力される', async () => {
    const deploymentInitiationTimestamp = new Date('2024-11-18T09:00:00Z');
    const reportingDeadlineTime = '09:00';
    const preparationDaysRequired = 5;

    const participantList: DeploymentParticipant[] = [
      {
        userId: 'pm001',
        role: 'ProjectManager',
        email: 'pm001@example.com',
      },
      {
        userId: 'mgr001',
        role: 'Manager',
        email: 'mgr001@example.com',
      },
      {
        userId: 'eng001',
        role: 'Engineer',
        email: 'eng001@example.com',
      },
      {
        userId: 'eng002',
        role: 'Engineer',
        email: 'eng002@example.com',
      },
      {
        userId: 'eng003',
        role: 'Engineer',
        email: 'eng003@example.com',
      },
      {
        userId: 'eng004',
        role: 'Engineer',
        email: 'eng004@example.com',
      },
      {
        userId: 'eng005',
        role: 'Engineer',
        email: 'eng005@example.com',
      },
      {
        userId: 'eng006',
        role: 'Engineer',
        email: 'eng006@example.com',
      },
      {
        userId: 'eng007',
        role: 'Engineer',
        email: 'eng007@example.com',
      },
      {
        userId: 'eng008',
        role: 'Engineer',
        email: 'eng008@example.com',
      },
      {
        userId: 'eng009',
        role: 'Engineer',
        email: 'eng009@example.com',
      },
      {
        userId: 'eng010',
        role: 'Engineer',
        email: 'eng010@example.com',
      },
    ];

    const mockAiClient = {
      extractInitialReportAnalysis: async (
        initialReports: Array<{ userId: string; yesterdayDone: string; todayPlan: string; currentIssues: string }>
      ): Promise<InitialReportAnalysisResult> => {
        const totalReports = initialReports.length;
        const submissionRate = (totalReports / participantList.filter((p) => p.role === 'Engineer').length) * 100;

        const keywordFrequencies = [
          { keyword: 'データ品質', frequency: 33.33 },
          { keyword: 'パフォーマンス', frequency: 33.33 },
          { keyword: 'セキュリティ', frequency: 33.34 },
        ];

        const totalFrequency = keywordFrequencies.reduce((sum, item) => sum + item.frequency, 0);
        const normalizedFrequencies = keywordFrequencies.map((item) => (item.frequency / totalFrequency) * 100);
        const formatUniformityScore = Math.round(normalizedFrequencies[0] * 100) / 100;

        const dataQualityScore = 82;

        return {
          submissionRate: Math.round(submissionRate * 100) / 100,
          dataQualityScore,
          formatUniformityScore,
          feedbackItems: [
            {
              userId: 'eng001',
              feedbackTitle: 'フォーマット改善',
              feedbackContent: 'より詳細な課題内容の記入をお願いします',
            },
          ],
        };
      },

      validateDeploymentInputs: async (
        input: Tx10AgentInput
      ): Promise<{ isValid: boolean; validationErrors: string[] }> => {
        const errors: string[] = [];
        if (!input.deploymentInitiationTimestamp) {
          errors.push('導入フロー開始時刻が未設定');
        }
        if (!input.reportingDeadlineTime) {
          errors.push('日報送信期限時刻が未設定');
        }
        if (!input.participantList || input.participantList.length === 0) {
          errors.push('参加者リストが空');
        }
        if (!input.preparationDaysRequired || input.preparationDaysRequired <= 0) {
          errors.push('事前準備期間が不正');
        }
        return {
          isValid: errors.length === 0,
          validationErrors: errors,
        };
      },

      generateDeploymentSchedule: async (
        deploymentInitiationTs: Date,
        preparationDays: number
      ): Promise<{
        deploymentStartDate: Date;
        phase1Deadline: Date;
        phase2Deadline: Date;
        productionStartDate: Date;
      }> => {
        const startDate = new Date(deploymentInitiationTs);
        startDate.setDate(startDate.getDate() + preparationDays);

        const phase1End = new Date(startDate);
        phase1End.setDate(phase1End.getDate() + 3);

        const phase2End = new Date(phase1End);
        phase2End.setDate(phase2End.getDate() + 4);

        const prodStart = new Date(phase2End);
        prodStart.setDate(prodStart.getDate() + 1);

        return {
          deploymentStartDate: startDate,
          phase1Deadline: phase1End,
          phase2Deadline: phase2End,
          productionStartDate: prodStart,
        };
      },

      generateTrainingMaterials: async (
        managerCount: number,
        engineerCount: number
      ): Promise<Array<{ materialType: string; targetRole: string; title: string; content: string }>> => {
        return [
          {
            materialType: 'guide',
            targetRole: 'Manager',
            title: '部長向けシステムガイド',
            content: '朝会報告管理システムの部長向け利用ガイドドキュメント',
          },
          {
            materialType: 'training',
            targetRole: 'Engineer',
            title: 'エンジニア向け研修教材',
            content: '朝会報告管理システムの操作方法と日報入力ガイド',
          },
        ];
      },

      evaluateOnboardingApproval: async (
        submissionRate: number,
        dataQualityScore: number,
        formatUniformityScore: number
      ): Promise<{
        approved: boolean;
        submissionRatePass: boolean;
        dataQualityPass: boolean;
        formatUniformityPass: boolean;
        feedback: string;
      }> => {
        const submissionPass = submissionRate >= 90;
        const qualityPass = dataQualityScore >= 80;
        const uniformityPass = formatUniformityScore >= 85;

        return {
          approved: submissionPass && qualityPass && uniformityPass,
          submissionRatePass: submissionPass,
          dataQualityPass: qualityPass,
          formatUniformityPass: uniformityPass,
          feedback:
            submissionPass && qualityPass && uniformityPass
              ? '本運用開始可能'
              : '改善が必要な項目があります',
        };
      },
    };

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    const output = await runTx10Imp1Agent(input, mockAiClient);

    expect(output).toBeDefined();
    expect(output).toHaveProperty('deploymentSchedule');
    expect(output).toHaveProperty('trainingMaterials');
    expect(output).toHaveProperty('initialReportAnalysis');
    expect(output).toHaveProperty('onboardingApprovalStatus');

    const analysisResult = output.initialReportAnalysis;
    expect(analysisResult).toBeDefined();
    expect(typeof analysisResult.formatUniformityScore).toBe('number');
    expect(analysisResult.formatUniformityScore).toBeGreaterThanOrEqual(0);
    expect(analysisResult.formatUniformityScore).toBeLessThanOrEqual(100);

    const firstCallFormatUniformity = analysisResult.formatUniformityScore;
    expect(firstCallFormatUniformity).toBe(33.33);

    const output2 = await runTx10Imp1Agent(input, mockAiClient);
    const analysisResult2 = output2.initialReportAnalysis;
    expect(analysisResult2.formatUniformityScore).toBe(firstCallFormatUniformity);

    const output3 = await runTx10Imp1Agent(input, mockAiClient);
    const analysisResult3 = output3.initialReportAnalysis;
    expect(analysisResult3.formatUniformityScore).toBe(firstCallFormatUniformity);

    const decimalPlaces = (num: number): number => {
      const match = String(num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
      if (!match) return 0;
      return Math.max(0, (match[1] ? match[1].length : 0) - (match[2] ? +match[2] : 0));
    };

    expect(decimalPlaces(firstCallFormatUniformity)).toBeLessThanOrEqual(2);

    expect(analysisResult.submissionRate).toBeDefined();
    expect(analysisResult.dataQualityScore).toBeDefined();
    expect(analysisResult.feedbackItems).toBeDefined();
    expect(Array.isArray(analysisResult.feedbackItems)).toBe(true);
  });
});