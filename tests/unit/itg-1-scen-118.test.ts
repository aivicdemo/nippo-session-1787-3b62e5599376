import { conductManagerTraining, type ManagerTrainingInput } from '../../src/logic/adoption-training-management';

describe('adoption-training-management', () => {
  // SCEN-118
  test('should throw ManagerNotFoundError when manager does not exist', () => {
    const managerId = 'non-existent-user-123';
    const guideMaterialId = 'guide-material-001';
    const confirmationTimestamp = new Date('2024-01-15T10:00:00Z');

    const input: ManagerTrainingInput = {
      managerId: managerId,
      guideMaterialId: guideMaterialId,
      understandingConfirmations: [
        { itemType: '操作方法', isAgreed: true },
        { itemType: '確認メール仕様', isAgreed: true },
        { itemType: '報告データ活用方法', isAgreed: true }
      ],
      confirmationTimestamp: confirmationTimestamp
    };

    expect(() => conductManagerTraining(input)).toThrow(/指定されたマネージャーが見つかりません/);
  });
});