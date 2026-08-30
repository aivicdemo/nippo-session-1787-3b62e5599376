import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { conductEngineerGroupTraining } from '../../src/logic/adoption-training-management';

describe('adoption-training-management - conductEngineerGroupTraining', () => {
  // SCEN-120
  test('should complete engineer group training with 10 engineers and return all results with completion status', async () => {
    // Setup: Mock dependencies
    const mockGenerateTrainingMaterial = jest.fn();
    const mockCalculateSkillScore = jest.fn();
    const mockSaveReport = jest.fn();

    // Mock training material generation - returns non-empty array of training materials
    mockGenerateTrainingMaterial.mockResolvedValue([
      {
        trainingMaterialId: 'material-001',
        operationProcedureSection: 'Dashboard access procedure...',
        operationRulesSection: 'Operation rules definition...',
        practicalExerciseSection: 'Practical exercises...',
      },
    ]);

    // Mock skill score calculation - each engineer gets a score between 0-100
    mockCalculateSkillScore
      .mockResolvedValueOnce(85) // eng-001
      .mockResolvedValueOnce(78) // eng-002
      .mockResolvedValueOnce(92) // eng-003
      .mockResolvedValueOnce(88) // eng-004
      .mockResolvedValueOnce(75) // eng-005
      .mockResolvedValueOnce(81) // eng-006
      .mockResolvedValueOnce(89) // eng-007
      .mockResolvedValueOnce(95) // eng-008
      .mockResolvedValueOnce(72) // eng-009
      .mockResolvedValueOnce(86); // eng-010

    // Mock save report - always returns resolved promise
    mockSaveReport.mockResolvedValue(undefined);

    // Mock fetch for practice environment URL access verification
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    // Input data
    const trainingSessionId = 'session-001';
    const engineerIds = [
      'eng-001',
      'eng-002',
      'eng-003',
      'eng-004',
      'eng-005',
      'eng-006',
      'eng-007',
      'eng-008',
      'eng-009',
      'eng-010',
    ];
    const trainingDate = new Date('2024-01-15T10:00:00Z');
    const practiceEnvironmentUrl = 'https://practice-env.example.com';

    // Execute function
    const result = await conductEngineerGroupTraining(
      trainingSessionId,
      engineerIds,
      trainingDate,
      practiceEnvironmentUrl
    );

    // Verify output structure and values
    expect(result).toBeDefined();
    expect(result.trainingSessionId).toBe('session-001');
    expect(result.participantResults).toHaveLength(10);

    // Verify each participant result has skill score and pass judgment
    expect(result.participantResults[0]).toEqual({
      engineerId: 'eng-001',
      operationSkillScore: 85,
      passJudgment: true, // 85 >= 70
    });

    expect(result.participantResults[1]).toEqual({
      engineerId: 'eng-002',
      operationSkillScore: 78,
      passJudgment: true, // 78 >= 70
    });

    expect(result.participantResults[4]).toEqual({
      engineerId: 'eng-005',
      operationSkillScore: 75,
      passJudgment: true, // 75 >= 70
    });

    expect(result.participantResults[8]).toEqual({
      engineerId: 'eng-009',
      operationSkillScore: 72,
      passJudgment: true, // 72 >= 70
    });

    // Verify training completion status
    expect(result.trainingCompletionStatus).toBe('completed');

    // Verify all engineers have pass judgment true (all scores >= 70)
    result.participantResults.forEach((participant) => {
      expect(participant.passJudgment).toBe(true);
      expect(participant.operationSkillScore).toBeGreaterThanOrEqual(70);
      expect(participant.operationSkillScore).toBeLessThanOrEqual(100);
    });
  });
});