export function errorHandler(err, req, res, next) {
  console.error('[error]', err.message || err);
  const status = err.status || 500;
  const message = err.expose ? err.message : (status === 500 ? '服务器内部错误' : err.message);
  res.status(status).json({ code: status, data: null, message });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ code: 404, data: null, message: '接口不存在' });
}
