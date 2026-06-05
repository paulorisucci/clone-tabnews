import password from "models/password";
import user from "models/user.js";
import { NotFoundError, UnauthorizedError } from "infra/errors.js";

async function authenticateUser(receivedUser) {
  try {
    const storedUser = await findUserByEmail(receivedUser.email);
    await validatePassword(receivedUser.password, storedUser.password);

    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos.",
      });
    }

    throw error;
  }
}

async function findUserByEmail(receivedEmail) {
  let storedUser;

  try {
    storedUser = await user.findOneByEmail(receivedEmail);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new UnauthorizedError({
        message: "E-mail não confere.",
        action: "Verifique se este dado está correto.",
      });
    }

    throw error;
  }

  return storedUser;
}

async function validatePassword(receivedPassword, storedPassword) {
  const correctPasswordMatch = await password.compare(
    receivedPassword,
    storedPassword,
  );

  if (!correctPasswordMatch) {
    throw new UnauthorizedError({
      message: "Senha não confere.",
      action: "Verifique se este dado está correto.",
    });
  }
}

const authentication = {
  authenticateUser,
};

export default authentication;
