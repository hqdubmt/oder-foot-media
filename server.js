
require('dotenv').config();

const app = require('./src/app');
const initializeMinio = require('./src/inits/minio.Inits');

const config = app.get('config') || {};

const PORT = config.PORT || 5001;
const ENV = config.ENV || 'Dev';

let server;

// Xử lý Promise bị từ chối nhưng chưa được bắt lỗi
process.on('unhandledRejection', (error) => {
  console.error('❌ LỖI NGHIÊM TRỌNG HỆ THỐNG:', error);

  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Khởi tạo MinIO trước khi chạy Server
const startServer = async () => {
  try {
    const { bucket: bucketName } = await initializeMinio();

    console.log(`MinIO bucket sẵn sàng: ${bucketName}`);

    server = app.listen(PORT, () => {
      console.log('=========================================');
      console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
      console.log(`🌍 Môi trường hiện tại: [ ${ENV.toUpperCase()} ]`);
      console.log('=========================================');
    });
  } catch (error) {
    console.error('❌ Không thể khởi động Server:', error);
    process.exit(1);
  }
};

startServer();
