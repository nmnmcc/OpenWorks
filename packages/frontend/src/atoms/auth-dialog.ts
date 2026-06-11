import { Atom } from "effect/unstable/reactivity";

export type AuthDialogMode = "login" | "register";

export const authDialogAtom = Atom.make<{ readonly open: boolean; readonly mode: AuthDialogMode }>({
  open: false,
  mode: "login",
});
