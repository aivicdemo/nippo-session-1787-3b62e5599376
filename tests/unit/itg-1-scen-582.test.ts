import { conductEngineerGroupTraining } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム - エンジニア集合研修実施', () => {
  // SCEN-582
  test('エンジニアIDが空文字列のときエラーをスローする', () => {
    const trainingSessionId = 'session-001';
    const engineerIds = ['eng-001', '', 'eng-003', 'eng-004', 'eng-005', 'eng-006', 'eng-007', 'eng-008', 'eng-009', 'eng-010'];
    const trainingDate = new Date('2024-01-15T10:00:00Z');
    const practiceEnvironmentUrl = 'https://practice.example.com/app';

    expect(() => {
      conductEngineerGroupTraining({
        trainingSessionId,
        engineerIds,
        trainingDate,
        practiceEnvironmentUrl,
      });
    }).toThrow(/エンジニアID/);
  });
});