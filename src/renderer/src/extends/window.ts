export {};

declare global {
  interface Window {
    createPlayer: (channel: String, main?: Boolean) => void;
    mainPlayer: (channel: String) => void;
    setPlayer: (channel: String, main?: Boolean) => void;
  }
}