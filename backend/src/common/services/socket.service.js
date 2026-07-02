export function disconnectAdminSockets(io, adminId) {
  if (!io || !adminId) return;
  io.in(`admin:${adminId}`).disconnectSockets(true);
}

export function emitAdminEvent(io, event, payload) {
  if (!io) return false;
  try {
    io.to("admins").emit(event, payload);
    return true;
  } catch (error) {
    console.error(`Unable to emit Socket.IO admin event "${event}"`, error);
    return false;
  }
}
