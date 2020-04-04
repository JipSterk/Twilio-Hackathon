import { Ctx, Query, Resolver } from "type-graphql";
import { User } from "../../entity/User";
import { Context } from "../../types/context";

@Resolver(User)
export class UserResolver {
  @Query(() => User)
  public viewer(@Ctx() { req, userLoader }: Context): Promise<User> {
    return userLoader.load(req.session?.userId);
  }
}
