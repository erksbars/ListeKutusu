import JBackgammonModule from "@mrlhumphreys/jbackgammon";

const engine = "Match" in JBackgammonModule
  ? JBackgammonModule
  : JBackgammonModule.default;

export type BackgammonEngineMatch = InstanceType<typeof engine.Match>;

export function createBackgammonEngineMatch(state: ConstructorParameters<typeof engine.Match>[0]) {
  return new engine.Match(state) as BackgammonEngineMatch;
}
