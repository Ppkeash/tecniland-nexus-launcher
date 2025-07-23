/**
 * Funciones de utilidad relacionadas con el lanzamiento del juego
 * Minecraft de forma local.
 */
export function launchLocalGame() {
  // Enviamos un mensaje al proceso principal de Electron para que ejecute
  // el script configurado y así iniciar el juego.
  window.ipc.send('launch-local-game');
}
