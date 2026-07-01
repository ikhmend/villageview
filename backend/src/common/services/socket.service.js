export function disconnectAdminSockets(io, adminId) {
  if (!io || !adminId) return;
  io.in(`admin:${adminId}`).disconnectSockets(true);
}