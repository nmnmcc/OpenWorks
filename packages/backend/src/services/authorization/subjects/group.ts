export type GroupSubjects = {
  readonly Group: {
    readonly id: string;
    readonly slug: string;
    readonly visibility: string;
  };
  readonly Role: {
    readonly id: string;
    readonly groupId: string;
  };
  readonly Permission: {
    readonly id: string;
  };
  readonly GroupMember: {
    readonly id: string;
    readonly groupId: string;
    readonly userId: string;
    readonly roleId: string;
  };
  readonly GroupInvitation: {
    readonly id: string;
    readonly groupId: string;
    readonly email: string;
    readonly roleId: string;
    readonly invitedById: string;
    readonly status: string;
  };
  readonly GroupBan: {
    readonly id: string;
    readonly groupId: string;
    readonly userId: string;
  };
  readonly GroupMute: {
    readonly id: string;
    readonly groupId: string;
    readonly userId: string;
  };
  readonly GroupRule: {
    readonly id: string;
    readonly groupId: string;
  };
  readonly ModLog: {
    readonly id: string;
    readonly groupId: string;
  };
  readonly WikiPage: {
    readonly id: string;
    readonly groupId: string;
  };
  readonly UserFlair: {
    readonly id: string;
    readonly groupId: string;
    readonly userId: string;
  };
};
