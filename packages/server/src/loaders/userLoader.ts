import DataLoader from "dataloader";
import { getRepository } from "typeorm";
import { User } from "../entity/User";

export const userLoader = (): DataLoader<string, User> =>
  new DataLoader(
    async (keys: readonly string[]): Promise<User[]> => {
      const users = await getRepository(User).findByIds(keys as string[]);

      const userMap: { [key: string]: User } = {};

      users.forEach(user => {
        userMap[user.id] = user;
      });

      return keys.map(key => userMap[key]);
    }
  );