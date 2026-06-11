export type SpaceSubjects = {
  readonly Space: {
    readonly id: string;
    readonly slug: string;
    readonly visibility: string;
  };
  readonly Role: {
    readonly id: string;
    readonly spaceId: string;
  };
  readonly Permission: {
    readonly id: string;
  };
  readonly SpaceMember: {
    readonly id: string;
    readonly spaceId: string;
    readonly userId: string;
    readonly roleId: string;
  };
  readonly SpaceInvitation: {
    readonly id: string;
    readonly spaceId: string;
    readonly email: string;
    readonly roleId: string;
    readonly invitedById: string;
    readonly status: string;
  };
  readonly SpaceBan: {
    readonly id: string;
    readonly spaceId: string;
    readonly userId: string;
  };
  readonly SpaceMute: {
    readonly id: string;
    readonly spaceId: string;
    readonly userId: string;
  };
  readonly SpaceRule: {
    readonly id: string;
    readonly spaceId: string;
  };
  readonly ModLog: {
    readonly id: string;
    readonly spaceId: string;
  };
  readonly WikiPage: {
    readonly id: string;
    readonly spaceId: string;
  };
  readonly UserFlair: {
    readonly id: string;
    readonly spaceId: string;
    readonly userId: string;
  };
};
