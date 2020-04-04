import { Connection, createConnection, getConnectionOptions } from "typeorm";

export const createTypeormConnection = async (): Promise<Connection | null> => {
  let retries = 5;
  while (retries) {
    try {
      const config = await getConnectionOptions(process.env.NODE_ENV);
      return createConnection({
        ...config,
        name: "default",
      });
    } catch (error) {
      console.log(error);
      retries -= 1;
      console.log(`retries left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  return null;
};