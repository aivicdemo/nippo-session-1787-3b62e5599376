import { conductEngineerGroupTraining } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム - 全エンジニア向け集合研修実施', () => {
  // SCEN-579
  test('[error] ログイン試行回数が0回または負の数のときエラーをスロー', () => {
    const trainingSessionId = 'SESSION-001';
    const engineerIds = [
      'ENG001', 'ENG002', 'ENG003', 'ENG004', 'ENG005',
      'ENG006', 'ENG007', 'ENG008', 'ENG009', 'ENG010'
    ];
    const trainingDate = new Date('2024-01-15T10:00:00Z');
    const practiceEnvironmentUrl = 'https://practice.example.com';

    const participantResults = [
      {
        engineerId: 'ENG001',
        operationSkillScore: 0,
        passJudgment: false,
        loginAttempts: 0,
        formCompletionTime: 120,
        fieldAccuracy: 85,
        submissionSuccess: true
      },
      {
        engineerId: 'ENG002',
        operationSkillScore: 75,
        passJudgment: true,
        loginAttempts: 1,
        formCompletionTime: 180,
        fieldAccuracy: 90,
        submissionSuccess: true
      },
      {
        engineerId: 'ENG003',
        operationSkillScore: 72,
        passJudgment: true,
        loginAttempts: 1,
        formCompletionTime: 200,
        fieldAccuracy: 88,
        submissionSuccess: true
      },
      {
        engineerId: 'ENG004',
        operationSkillScore: 68,
        passJudgment: false,
        loginAttempts: 3,
        formCompletionTime: 240,
        fieldAccuracy: 75,
        submissionSuccess: true
      },
      {
        engineerId: 'ENG005',
        operationSkillScore: 78,
        passJudgment: true,
        loginAttempts: 1,
        formCompletionTime: 160,
        fieldAccuracy: 92,
        submissionSuccess: true
      },
      {
        engineerId: 'ENG006',
        operationSkillScore: 80,
        passJudgment: true,
        loginAttempts: 1,
        formCompletionTime: 150,
        fieldAccuracy: 95,
        submissionSuccess: true
      },
      {
        engineerId: 'ENG007',
        operationSkillScore: 76,
        passJudgment: true,
        loginAttempts: 2,
        formCompletionTime: 190,
        fieldAccuracy: 89,
        submissionSuccess: true
      },
      {
        engineerId: 'ENG008',
        operationSkillScore: 71,
        passJudgment: true,
        loginAttempts: 1,
        formCompletionTime: 210,
        fieldAccuracy: 86,
        submissionSuccess: true
      },
      {
        engineerId: 'ENG009',
        operationSkillScore: 74,
        passJudgment: true,
        loginAttempts: 1,
        formCompletionTime: 170,
        fieldAccuracy: 91,
        submissionSuccess: true
      },
      {
        engineerId: 'ENG010',
        operationSkillScore: 77,
        passJudgment: true,
        loginAttempts: 1,
        formCompletionTime: 180,
        fieldAccuracy: 87,
        submissionSuccess: true
      }
    ];

    expect(() => {
      conductEngineerGroupTraining(
        trainingSessionId,
        engineerIds,
        trainingDate,
        practiceEnvironmentUrl,
        participantResults
      );
    }).toThrow(/ログイン試行データが不正です/);
  });
});