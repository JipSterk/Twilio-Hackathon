import DataLoader from "dataloader";
import { Request } from "express";
import { User } from "../entity/User";

export interface Context {
  req: Request;
  userLoader: DataLoader<string, User>;
}
