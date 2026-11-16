require('dotenv').config();
const app = require('./src/app');
const initializeMinio = require('./src/inits/minio.Inits');

const config = app.get('config') || {};
const PORT = config.PORT || 5001;
const ENV = config.ENV || 'Dev';
let server;

process.on('unhandledRejection', (error) => {
  console.error('❌ LỖI NGHIÊM TRỌNG HỆ THỐNG:', error.message);
  if (server) {
    server.close(() => process.exit(1));
    return;
  }
  process.exit(1);
});

initializeMinio()
  .then((bucketName) => {
    console.log(`MinIO bucket sẵn sàng: ${bucketName}`);
    server = app.listen(PORT, () => {
      console.log('=========================================');
      console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
      console.log(`🌍 Môi trường hiện tại: [ ${ENV.toUpperCase()} ]`);
      console.log('=========================================');
    });
  })
  .catch((error) => {
    console.error('❌ Không thể khởi tạo MinIO:', error.message);
    process.exitCode = 1;
  });
