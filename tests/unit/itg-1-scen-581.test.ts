import { conductEngineerGroupTraining } from '../../src/logic/adoption-training-management';
import { type EngineerGroupTrainingInput, type EngineerGroupTrainingResult, type EngineerTrainingParticipantResult } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム - エンジニア向け集合研修実施', () => {
  // SCEN-581: [edge] 全エンジニア10名が統一された研修内容でアプリ操作を学習し、実習環境での一連操作を完了させる。
  // 入力内容の正確性スコアが0～100の範囲外のときという明示された境界条件で正確性スコアを0～100の範囲に正規化します
  test('should normalize fieldAccuracy score to 0-100 range when input exceeds boundary and calculate proficiency score correctly', () => {
    // Arrange
    const trainingSessionId = 'session-001';
    const engineerIds = [
      'E001',
      'E002',
      'E003',
      'E004',
      'E005',
      'E006',
      'E007',
      'E008',
      'E009',
      'E010'
    ];
    const trainingDate = new Date('2024-02-15T09:00:00Z');
    const practiceEnvironmentUrl = 'https://practice.example.com/app';

    // Create participant operation data for E001 with fieldAccuracy=150 (out of range)
    const participantOperationData = {
      engineerId: 'E001',
      loginAttempts: 1,
      formCompletionTime: 120,
      fieldAccuracy: 150, // Out of range (should be 0-100)
      submissionSuccess: true
    };

    const trainingInput: EngineerGroupTrainingInput = {
      trainingSessionId: trainingSessionId,
      engineerIds: engineerIds,
      trainingDate: trainingDate,
      practiceEnvironmentUrl: practiceEnvironmentUrl,
      participantOperationData: [participantOperationData]
    };

    // Act
    const result: EngineerGroupTrainingResult = conductEngineerGroupTraining(trainingInput);

    // Assert
    // Verify that the result contains the training session ID
    expect(result.trainingSessionId).toBe(trainingSessionId);

    // Verify training completion status
    expect(result.trainingCompletionStatus).toBe('completed');

    // Find the participant result for E001
    const e001Result: EngineerTrainingParticipantResult | undefined = result.participantResults.find(
      (p) => p.engineerId === 'E001'
    );

    // Verify that E001's result exists
    expect(e001Result).toBeDefined();

    if (e001Result) {
      // Verify that fieldAccuracy was normalized to 100 (clamped from 150)
      // Expected proficiency score calculation after normalization:
      // loginScore = 25 (1 attempt)
      // timeScore = 25 (120 seconds ≤ 180 seconds)
      // accuracyScore = 100 (normalized from 150)
      // submissionScore = 25 (submission successful)
      // Total before normalization = 175
      // After normalization to 0-100 range = 100

      expect(e001Result.operationSkillScore).toBe(100);
      expect(e001Result.passJudgment).toBe(true); // 70+ points = pass
    }
  });
});