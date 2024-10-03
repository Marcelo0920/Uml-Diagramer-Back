import { User } from "../models/User";
import ErrorHandler from "../utils/error";
import jwt from "jsonwebtoken";

export const isAuthenticated = async (req, res, next) => {
  const token = req.headers["sw1"];
  if (!token) {
    return next(new ErrorHandler("No Autenticado", 401));
  }

  const decodedData = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decodedData.user.id);
  next();
};
