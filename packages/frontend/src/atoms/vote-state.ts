import { Atom } from "effect/unstable/reactivity";

export interface VoteState {
  readonly voteId: string;
  readonly value: 1 | -1;
  readonly delta: number;
}

export const voteStateAtom = Atom.make<Readonly<Record<string, VoteState>>>({});
