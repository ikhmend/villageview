export function sendSuccess(res, data = null, message = "Success", meta = undefined) {
  const response = { success: true, message, data };
  if (meta !== undefined) response.meta = meta;
  return res.status(200).json(response);
}
