import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('submission-status-tracking', () => {
  // SCEN-1621: [normal] 未提出メンバー抽出機能 - 報告提出状況から未提出メンバー複数人を抽出し、複数人の未提出者がリストに含まれる
  test('should extract exactly 5 unsubmitted members from a team of 10 members', async () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'manager-001';
    
    // Setup: 10 team members registered in the system
    const submittedMemberIds = ['member-1', 'member-2', 'member-3', 'member-4', 'member-5'];
    const unsubmittedMemberIds = ['member-6', 'member-7', 'member-8', 'member-9', 'member-10'];
    
    // Mock team members data
    const teamMembers = [
      {
        userId: 'member-1',
        userName: 'Member One',
        email: 'member1@example.com',
      },
      {
        userId: 'member-2',
        userName: 'Member Two',
        email: 'member2@example.com',
      },
      {
        userId: 'member-3',
        userName: 'Member Three',
        email: 'member3@example.com',
      },
      {
        userId: 'member-4',
        userName: 'Member Four',
        email: 'member4@example.com',
      },
      {
        userId: 'member-5',
        userName: 'Member Five',
        email: 'member5@example.com',
      },
      {
        userId: 'member-6',
        userName: 'Member Six',
        email: 'member6@example.com',
      },
      {
        userId: 'member-7',
        userName: 'Member Seven',
        email: 'member7@example.com',
      },
      {
        userId: 'member-8',
        userName: 'Member Eight',
        email: 'member8@example.com',
      },
      {
        userId: 'member-9',
        userName: 'Member Nine',
        email: 'member9@example.com',
      },
      {
        userId: 'member-10',
        userName: 'Member Ten',
        email: 'member10@example.com',
      },
    ];
    
    // Mock input
    const input = {
      teamId,
      reportDate,
      morningMeetingStartTime: '09:00',
      executorUserId: requestUserId,
    };
    
    // Mock repository to return team data and submission status
    const mockRepository = {
      getTeamMembers: async () => teamMembers,
      getSubmittedReports: async () => submittedMemberIds.map(userId => ({
        userId,
        submissionTimestamp: new Date('2024-01-15T08:00:00Z'),
        reportDate,
      })),
      getAllTeamMemberSubmissions: async () => ({
        submittedCount: 5,
        unsubmittedCount: 5,
        totalMembers: 10,
      }),
    };
    
    // Call the function
    const result = await detectAndNotifyUnsubmittedMembers(input, mockRepository);
    
    // Verify the result
    expect(result.unsubmittedMembers).toHaveLength(5);
    
    // Verify all unsubmitted members are included
    const returnedUserIds = result.unsubmittedMembers.map(m => m.userId);
    expect(returnedUserIds).toEqual(expect.arrayContaining(unsubmittedMemberIds));
    
    // Verify submitted members are NOT included
    const submittedUserIdsInResult = returnedUserIds.filter(id => submittedMemberIds.includes(id));
    expect(submittedUserIdsInResult).toHaveLength(0);
    
    // Verify each unsubmitted member has correct identification data
    result.unsubmittedMembers.forEach((member, index) => {
      const expectedMember = teamMembers.find(m => m.userId === unsubmittedMemberIds[index]);
      expect(member.userId).toBe(expectedMember?.userId);
      expect(member.userName).toBe(expectedMember?.userName);
      expect(member.email).toBe(expectedMember?.email);
    });
    
    // Verify remainingMinutes is calculated correctly
    // Meeting starts at 09:00, current time is ~08:00, so remaining ~60 minutes
    result.unsubmittedMembers.forEach((member) => {
      expect(typeof member.remainingMinutes).toBe('number');
      expect(member.remainingMinutes).toBeGreaterThan(0);
    });
  });
});