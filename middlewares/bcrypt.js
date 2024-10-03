import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (password, userPassword) => {
  return await bcrypt.compare(password, userPassword);
};

export const generateToken = async (payload, expiresIn) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const decodeToken = async (payload) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  return jwt.decode(payload, JWT_SECRET);
};
