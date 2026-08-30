import { describe, test, expect } from '@jest/globals';
import { conductManagerTraining } from '../../src/logic/adoption-training-management';
import { type ManagerTrainingInput } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム - 部長向けガイド資料の理解確認', () => {
  test('SCEN-119: 理解確認項目が不完全な場合にエラーが発生すること', () => {
    const input: ManagerTrainingInput = {
      managerId: 'manager-001',
      guideMaterialId: 'guide-material-001',
      understandingConfirmations: [
        {
          itemType: '操作方法',
          isAgreed: true,
        },
        {
          itemType: '確認メール仕様',
          isAgreed: true,
        },
        {
          itemType: '報告データ活用方法',
          isAgreed: false,
        },
      ],
      confirmationTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    expect(() => conductManagerTraining(input)).toThrow(/理解確認/);
    try {
      conductManagerTraining(input);
    } catch (error: unknown) {
      const err = error as Error & { trainingStatus?: string; nextPhaseApproved?: boolean };
      expect(err.message).toBe(
        '部長の理解確認が完了していません。すべての確認項目に合意してください'
      );
      expect(err.trainingStatus).toBe('理解不完全');
      expect(err.nextPhaseApproved).toBe(false);
    }
  });
});