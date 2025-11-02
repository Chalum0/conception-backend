import User from "../models/user.model.js";


export async function createUser({  }) {
  const user = await User.create({  });
  return user;
}
