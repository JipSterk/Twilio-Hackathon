import { ApolloError, ApolloServer } from "apollo-server-express";
import connectRedis from "connect-redis";
import cors from "cors";
import "dotenv-safe/config";
import express from "express";
import session from "express-session";
import { GraphQLError, GraphQLFormattedError } from "graphql";
import http from "http";
import { AddressInfo } from "net";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { Container } from "typedi";
import { useContainer } from "typeorm";
import { v4 } from "uuid";
import { createTypeormConnection } from "./createTypeormConnection";
import { userLoader } from "./loaders/userLoader";
import { redis } from "./redis";

const RedisStore = connectRedis(session);

useContainer(Container);

const startServer = async (): Promise<void> => {
  const connection = await createTypeormConnection();
  if (connection) {
    await connection.runMigrations();
  }

  const app = express();

  const sessionMiddleware = session({
    store: new RedisStore({
      client: redis,
    }),
    name: "qid",
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7 * 365,
    },
  });

  const server = new ApolloServer({
    schema: await buildSchema({
      resolvers: [__dirname + "/modules/**/resolver.{ts,js}"],
      container: Container,
    }),
    context: ({ req, connection }) => ({
      req,
      connection,
      userLoader: userLoader(),
    }),
    formatError: (error: GraphQLError): GraphQLFormattedError => {
      if (error.originalError instanceof ApolloError) {
        return error;
      }

      const errorId = v4();
      console.log("errorId: ", errorId);
      console.log(error);

      return new GraphQLError(`Internal Error: ${errorId}`);
    },
    subscriptions: {
      onConnect: (_, webSocket: any) => {
        return new Promise((resolve) =>
          sessionMiddleware(webSocket.upgradeReq, {} as any, () => {
            resolve({ req: webSocket.upgradeReq });
          })
        );
      },
    },
  });

  app.set("trust proxy", 1);

  app.use(
    cors({
      credentials: true,
      origin:
        process.env.NODE_ENV === "production"
          ? "http://localhost:3000"
          : "http://localhost:3000",
    })
  );

  app.use((req, _, next) => {
    const authorization = req.headers.authorization;

    if (authorization) {
      try {
        const qid = authorization.split(" ")[1];
        req.headers.cookie = `qid=${qid}`;
      } catch {}
    }

    return next();
  });

  app.use(sessionMiddleware);

  server.applyMiddleware({ app, cors: false });

  const httpServer = http.createServer(app);
  server.installSubscriptionHandlers(httpServer);

  const listener = httpServer.listen({ port: 4000 }, () => {
    const { address, port } = listener.address() as AddressInfo;

    console.log(
      `Server ready at http://${address}:${port}${server.graphqlPath}`
    );
  });
};

startServer();
