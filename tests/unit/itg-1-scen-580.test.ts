import { conductEngineerGroupTraining } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム - 全エンジニア向け集合研修実施', () => {
  test('SCEN-580: formCompletionTime が 0 秒のときエラーがスローされる', () => {
    const trainingSessionId = 'SESSION-001';
    const engineerIds = [
      'ENG001',
      'ENG002',
      'ENG003',
      'ENG004',
      'ENG005',
      'ENG006',
      'ENG007',
      'ENG008',
      'ENG009',
      'ENG010',
    ];
    const trainingDate = new Date('2024-01-15T10:00:00Z');
    const practiceEnvironmentUrl = 'https://practice.example.com/app';

    const input = {
      trainingSessionId,
      engineerIds,
      trainingDate,
      practiceEnvironmentUrl,
    };

    expect(() => {
      conductEngineerGroupTraining(input);
    }).toThrow(/入力時間データが不正です/);
  });
});