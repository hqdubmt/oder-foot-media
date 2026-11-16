const { Ok, Created } = require('../../../cors/sycessReponse.cors');

class UserControllers {
  async getUsers(req, res) {
    return new Ok({
      message: 'Users fetched successfully',
      description: 'Lấy danh sách người dùng thành công.',
      metadata: { users: [] }
    }).send(res);
  }

  async getUserById(req, res) {
    return new Ok({
      message: 'User fetched successfully',
      description: 'Lấy thông tin người dùng thành công.',
      metadata: { user: { id: req.params.id } }
    }).send(res);
  }

  async createUser(req, res) {
    return new Created({
      message: 'User created successfully',
      description: 'Tạo người dùng thành công.',
      metadata: { user: req.body }
    }).send(res);
  }

  async updateUser(req, res) {
    return new Ok({
      message: 'User updated successfully',
      description: 'Cập nhật người dùng thành công.',
      metadata: { user: { id: req.params.id, ...req.body } }
    }).send(res);
  }

  async deleteUser(req, res) {
    return new Ok({
      message: 'User deleted successfully',
      description: 'Xóa người dùng thành công.',
      metadata: { userId: req.params.id }
    }).send(res);
  }
}

module.exports = new UserControllers();
module.exports.UserControllers = UserControllers;
