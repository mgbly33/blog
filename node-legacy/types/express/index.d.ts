import { IUser } from '../../models/user';

declare global {
  namespace Express {
    interface Request {
      session: {
        user?: IUser;
        [key: string]: any;
      };
    }
  }
}
