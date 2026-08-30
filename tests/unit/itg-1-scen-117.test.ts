import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { conductManagerTraining } from '../../src/logic/adoption-training-management';
import type { ManagerTrainingInput, ManagerTrainingResult } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム - 部長向け研修実施', () => {
  // SCEN-117: 部長向けガイド資料を提示し、操作手順・運用ルール・トラブル対応方法の理解を確認して全エンジニア向け研修実施を承認する
  test('部長が3項目すべてに合意した場合、研修ステータスが理解完了となり次フェーズが承認される', () => {
    const managerId = 'mgr-001';
    const guideMaterialId = 'guide-mat-001';
    const confirmationTimestamp = new Date('2024-01-15T10:00:00Z');

    const input: ManagerTrainingInput = {
      managerId: managerId,
      guideMaterialId: guideMaterialId,
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
          isAgreed: true,
        },
      ],
      confirmationTimestamp: confirmationTimestamp,
    };

    const result: ManagerTrainingResult = conductManagerTraining(input);

    expect(result.trainingStatus).toBe('理解完了');
    expect(result.nextPhaseApproved).toBe(true);
    expect(result.completionTimestamp).toEqual(confirmationTimestamp);
  });
});