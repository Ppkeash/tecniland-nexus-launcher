/**
 * Utilities related to launching the local Minecraft instance.
 */
export function launchLocalGame() {
  // Delegate the launch to the Electron main process
  window.ipc.send('launch-local-game');
}
