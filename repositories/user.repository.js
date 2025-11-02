/**
 * Thin data-access layer for the User model.
 * Keeps Sequelize specifics out of higher layers.
 */
export const createUserRepository = (UserModel) => ({
  create: (attrs) => UserModel.create(attrs),

  findByEmail: (email) =>
    UserModel.findOne({
      where: { email },
    }),

  findById: (id) => UserModel.findByPk(id),
});
