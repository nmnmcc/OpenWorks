import { Atom } from "effect/unstable/reactivity";

export const postComposeDialogAtom = Atom.make<{
  readonly open: boolean;
  readonly spaceId: string;
  readonly workId?: string;
  readonly isReview?: boolean;
}>({
  open: false,
  spaceId: "",
});
