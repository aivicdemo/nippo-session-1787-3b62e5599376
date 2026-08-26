import { listTeamMembers } from "../../src/logic/team-member-selection";
import { type ListTeamMembersInput, type ListTeamMembersOutput } from "../../src/logic/team-member-selection";

const fetchMock = require("jest-fetch-mock");

describe("listTeamMembers", () => {
  // SCEN-037
  test("should return team members list with valid email addresses for reminder notification targets", async () => {
    fetchMock.resetMocks();

    const mockMembers = [
      {
        memberId: "user-001",
        memberName: "田中太郎",
        email: "tanaka@example.com",
        isActive: true,
      },
      {
        memberId: "user-002",
        memberName: "佐藤次郎",
        email: "satou@example.com",
        isActive: true,
      },
      {
        memberId: "user-003",
        memberName: "鈴木三郎",
        email: "suzuki@example.com",
        isActive: true,
      },
      {
        memberId: "user-004",
        memberName: "高橋四郎",
        email: "takahashi@example.com",
        isActive: true,
      },
      {
        memberId: "user-005",
        memberName: "伊藤五郎",
        email: "itou@example.com",
        isActive: true,
      },
      {
        memberId: "user-006",
        memberName: "渡辺六郎",
        email: "watanabe@example.com",
        isActive: true,
      },
      {
        memberId: "user-007",
        memberName: "中村七郎",
        email: "nakamura@example.com",
        isActive: true,
      },
      {
        memberId: "user-008",
        memberName: "小林八郎",
        email: "kobayashi@example.com",
        isActive: true,
      },
      {
        memberId: "user-009",
        memberName: "加藤九郎",
        email: "katou@example.com",
        isActive: true,
      },
      {
        memberId: "user-010",
        memberName: "山田十郎",
        email: "yamada@example.com",
        isActive: true,
      },
    ];

    fetchMock.mockResponseOnce(
      JSON.stringify({
        teamId: "team-001",
        members: mockMembers,
        totalCount: 10,
      }),
      { status: 200 }
    );

    const input: ListTeamMembersInput = {
      teamId: "team-001",
    };

    const result: ListTeamMembersOutput = await listTeamMembers(input);

    expect(result.teamId).toBe("team-001");
    expect(result.totalCount).toBe(10);
    expect(result.members).toHaveLength(10);
    expect(result.members).toEqual(mockMembers);

    result.members.forEach((member) => {
      expect(member.memberId).toBeDefined();
      expect(member.memberName).toBeDefined();
      expect(member.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(member.isActive).toBe(true);
    });

    const memberIds = result.members.map((m) => m.memberId);
    const uniqueMemberIds = new Set(memberIds);
    expect(uniqueMemberIds.size).toBe(10);
  });
});