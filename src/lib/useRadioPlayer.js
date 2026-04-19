import { useEffect, useState } from "react";
import { radioPlayer } from "./radioPlayer";

export function useRadioPlayer() {
  const [state, setState] = useState(radioPlayer.getState());
  useEffect(() => radioPlayer.subscribe(setState), []);
  return { ...state, player: radioPlayer };
}