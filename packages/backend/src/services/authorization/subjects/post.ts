export type PostSubjects = {
  readonly Post: {
    readonly id: string;
    readonly authorId: string;
    readonly spaceId: string | null;
  };
  readonly Comment: {
    readonly id: string;
    readonly authorId: string;
    readonly postId: string;
    readonly spaceId: string | null;
  };
  readonly Vote: {
    readonly id: string;
    readonly userId: string;
    readonly postId: string | null;
    readonly commentId: string | null;
  };
  readonly PostFlair: {
    readonly id: string;
    readonly spaceId: string;
  };
  readonly Report: {
    readonly id: string;
    readonly spaceId: string;
    readonly reporterId: string;
  };
};
