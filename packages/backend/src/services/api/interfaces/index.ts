import { HttpApi, OpenApi } from "effect/unstable/httpapi";

import { CommentsGroup } from "./comments";
import { CreatorsGroup } from "./creators";
import { FlairsGroup } from "./flairs";
import { HealthGroup } from "./health";
import { HiddenGroup } from "./hidden";
import { LibraryGroup } from "./library";
import { MediaGroup } from "./media";
import { MessagesGroup } from "./messages";
import { ModerationLogsGroup } from "./moderation-log";
import { NotificationsGroup } from "./notifications";
import { PollsGroup } from "./polls";
import { PostsGroup } from "./posts";
import { ReportsGroup } from "./reports";
import { RulesGroup } from "./rules";
import { SavedGroup } from "./saved";
import { ShelvesGroup } from "./shelves";
import { SpacesGroup } from "./spaces";
import { UsersGroup } from "./users";
import { VotesGroup } from "./votes";
import { WikiGroup } from "./wiki";
import { WorksGroup } from "./works";

export class Api extends HttpApi.make("api")
  .add(PostsGroup)
  .add(HealthGroup)
  .add(SpacesGroup)
  .add(CommentsGroup)
  .add(VotesGroup)
  .add(FlairsGroup)
  .add(SavedGroup)
  .add(HiddenGroup)
  .add(ReportsGroup)
  .add(RulesGroup)
  .add(ModerationLogsGroup)
  .add(MessagesGroup)
  .add(NotificationsGroup)
  .add(WikiGroup)
  .add(UsersGroup)
  .add(PollsGroup)
  .add(MediaGroup)
  .add(WorksGroup)
  .add(CreatorsGroup)
  .add(LibraryGroup)
  .add(ShelvesGroup)
  .prefix("/api")
  .annotateMerge(
    OpenApi.annotations({
      title: "OpenWorks API",
      version: "0.1.0",
      description: "OpenWorks 后端 HTTP API",
    }),
  ) {}

export * from "./posts";
export * from "./health";
export * from "./spaces";
export * from "./comments";
export * from "./votes";
export * from "./flairs";
export * from "./saved";
export * from "./hidden";
export * from "./reports";
export * from "./rules";
export * from "./moderation-log";
export * from "./messages";
export * from "./notifications";
export * from "./wiki";
export * from "./users";
export * from "./polls";
export * from "./media";
export * from "./works";
export * from "./creators";
export * from "./library";
export * from "./shelves";
export * from "./middlewares/auth";
