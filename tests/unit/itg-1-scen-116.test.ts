import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { planAdoptionSchedule } from '../../src/logic/adoption-training-management';
import type { AdoptionSchedulePlanInput } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム - 導入計画スケジュール策定', () => {
  // SCEN-116
  test('参加者リストが空の場合、必須役割不足エラーが発生すること', () => {
    const input: AdoptionSchedulePlanInput = {
      participantList: [],
      minimumPreparationDaysInBusinessDays: 10,
      targetAdoptionStartDate: '2026-09-01',
      executorUserId: 'pm-user-001',
    };

    expect(() => planAdoptionSchedule(input)).toThrow(/必須役割/);
  });
});