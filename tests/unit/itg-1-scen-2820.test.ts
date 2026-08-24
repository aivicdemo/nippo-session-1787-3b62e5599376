import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import type { DetectUnsubmittedMembersInput, DetectUnsubmittedMembersOutput } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー検出・通知ロジック', () => {
  // SCEN-2820: [error] 未提出メンバー優先度リスト取得 - メンバーの優先度スコアがnullのとき、エラーが発生する
  test('メンバーの優先度スコアがnullのとき、エラーをスロー', async () => {
    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'sent' }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'sent' }),
    };

    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn().mockResolvedValue({ keywords: [] }),
      assessImpactScore: jest.fn().mockResolvedValue({ score: 0 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'low' }),
    };

    const input: DetectUnsubmittedMembersInput = {
      teamId: 'TEAM-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'USER-ADMIN',
    };

    const mockUnsubmittedMembers = [
      {
        userId: 'USER-001',
        userName: 'Taro Yamada',
        email: 'taro@example.com',
        priorityScore: null,
      },
    ];

    expect(() => {
      return detectAndNotifyUnsubmittedMembers(
        input,
        notificationServiceAdapterStub,
        textAnalysisServiceAdapterStub,
        mockUnsubmittedMembers
      );
    }).toThrow(/優先度スコア/);
  });
});