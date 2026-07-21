import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";
import orchestrator from "tests/orchestrator";
import sessionModel from "models/session";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/user", () => {
  describe("Default user", () => {
    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      });

      const sessionObject = await orchestrator.createSession(createdUser.id);

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const cacheControl = response.headers.get("Cache-Control");
      expect(cacheControl).toBe(
        "no-store, no-cache, max-age=0, must-revalidate",
      );

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "UserWithValidSession",
        email: createdUser.email,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      //Session renewal assertions

      const renewedSessionObject = await sessionModel.findOneValidByToken(
        sessionObject.token,
      );

      expect(
        renewedSessionObject.expires_at > sessionObject.expires_at,
      ).toEqual(true);
      expect(
        renewedSessionObject.updated_at > sessionObject.updated_at,
      ).toEqual(true);

      //Set-Cookie assertions

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: sessionObject.token,
        maxAge: sessionModel.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
      });
    });

    test("With nonexistent session", async () => {
      const nonexistentToken =
        "f70fb6702f3697e911690b56eea33450dc5ce0afa1f13f2cb49dd1614fd5c720c34f553002635beb0b1dc7e15eeac24f";

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${nonexistentToken}`,
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
      });
    });

    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - sessionModel.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithExpiredSession",
      });

      const session = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${session.token}`,
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
      });
    });

    test("With almost expired session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithAlmostExpiredSession",
      });

      const ONE_MINUTE_IN_MILLISECONDS = 60 * 1000;

      jest.useFakeTimers({
        now: new Date(
          Date.now() -
            (sessionModel.EXPIRATION_IN_MILLISECONDS -
              ONE_MINUTE_IN_MILLISECONDS),
        ),
      });

      const sessionObject = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "UserWithAlmostExpiredSession",
        email: createdUser.email,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      //Session renewal assertions

      const renewedSessionObject = await sessionModel.findOneValidByToken(
        sessionObject.token,
      );

      expect(
        renewedSessionObject.expires_at > sessionObject.expires_at,
      ).toEqual(true);
      expect(
        renewedSessionObject.updated_at > sessionObject.updated_at,
      ).toEqual(true);
      expect(
        renewedSessionObject.expires_at >
          new Date(Date.now() + ONE_MINUTE_IN_MILLISECONDS),
      );

      //Set-Cookie assertions

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: sessionObject.token,
        maxAge: sessionModel.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
      });
    });
  });
});
