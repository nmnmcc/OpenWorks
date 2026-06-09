import * as Atom from "effect/unstable/reactivity/Atom";
import { TodoRepoLive } from "@/layers/TodoRepoLive";

export const appRuntime = Atom.runtime(TodoRepoLive);
