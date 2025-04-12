import { ToastMessageOptions } from "primevue";

export {};

declare global {
  interface Window {
    createPlayer: (channel: String, main?: Boolean) => void;
    mainPlayer: (channel: String) => void;
    setPlayer: (channel: String, main?: Boolean) => void;
    playerRemoved: (channel: String) => void;
    toast: (arg: ToastMessageOptions) => void;
  }
}