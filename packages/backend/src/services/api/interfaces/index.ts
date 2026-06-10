import { HttpApi, OpenApi } from "effect/unstable/httpapi";
import { PostsGroup } from "./posts";
import { HealthGroup } from "./health";
import { GroupsGroup } from "./groups";
import { CommentsGroup } from "./comments";
import { VotesGroup } from "./votes";
import { FlairsGroup } from "./flairs";
import { SavedGroup } from "./saved";
import { HiddenGroup } from "./hidden";
import { ReportsGroup } from "./reports";
import { RulesGroup } from "./rules";
import { ModLogGroup } from "./mod-log";
import { MessagesGroup } from "./messages";
import { NotificationsGroup } from "./notifications";
import { WikiGroup } from "./wiki";
import { UsersGroup } from "./users";
import { PollsGroup } from "./polls";

export {
  Post,
  PostSearchResult,
  PostNotFound,
  PostForbidden,
  PostGroupNotFound,
  InvalidPoll,
  InvalidFlair,
  PostsGroup,
} from "./posts";
export { HealthGroup } from "./health";
export {
  Group,
  GroupMemberEntry,
  GroupBanEntry,
  GroupMuteEntry,
  GroupInvitationEntry,
  GroupNotFound,
  GroupForbidden,
  GroupSlugConflict,
  AlreadyMember,
  NotMember,
  UserBanned,
  InvitationNotFound,
  InvitationInvalid,
  GroupsGroup,
} from "./groups";
export {
  Comment,
  CommentNotFound,
  CommentForbidden,
  CommentTargetNotFound,
  PostLocked,
  CommentsGroup,
} from "./comments";
export { Vote, VoteForbidden, VoteConflict, VoteTargetNotFound, VotesGroup } from "./votes";
export { PostFlairEntry, UserFlairEntry, FlairNotFound, FlairForbidden, FlairsGroup } from "./flairs";
export { SavedItemEntry, SavedConflict, SavedTargetNotFound, SavedGroup } from "./saved";
export { HiddenPostEntry, HiddenTargetNotFound, HiddenGroup } from "./hidden";
export { ReportEntry, ReportNotFound, ReportForbidden, ReportTargetNotFound, ReportsGroup } from "./reports";
export { GroupRuleEntry, RuleNotFound, RuleForbidden, RulesGroup } from "./rules";
export { ModLogEntry, ModLogForbidden, ModLogGroup } from "./mod-log";
export { MessageEntry, MessageNotFound, MessageForbidden, RecipientNotFound, MessagesGroup } from "./messages";
export { NotificationEntry, NotificationNotFound, NotificationsGroup } from "./notifications";
export { WikiPageEntry, WikiRevisionEntry, WikiPageNotFound, WikiForbidden, WikiSlugConflict, WikiGroup } from "./wiki";
export { UserProfile, UserNotFound, UsersGroup } from "./users";
export { PollEntry, PollOptionEntry, PollNotFound, PollForbidden, PollClosed, PollsGroup } from "./polls";
export { CurrentSession, CurrentUser, Unauthorized, AuthMiddleware } from "./middlewares/auth";
export type { Session, User } from "./middlewares/auth";

export class Api extends HttpApi.make("api")
  .add(PostsGroup)
  .add(HealthGroup)
  .add(GroupsGroup)
  .add(CommentsGroup)
  .add(VotesGroup)
  .add(FlairsGroup)
  .add(SavedGroup)
  .add(HiddenGroup)
  .add(ReportsGroup)
  .add(RulesGroup)
  .add(ModLogGroup)
  .add(MessagesGroup)
  .add(NotificationsGroup)
  .add(WikiGroup)
  .add(UsersGroup)
  .add(PollsGroup)
  .annotateMerge(
    OpenApi.annotations({
      title: "OpenWorks API",
      version: "0.1.0",
      description: "OpenWorks 后端 HTTP API",
    }),
  ) {}
