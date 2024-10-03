import { generateToken } from "../middlewares/bcrypt.js";

export const sendToken = async (res, message, statusCode, user, payload) => {
  const token = await generateToken(payload, 360000);

  res
    .status(statusCode)
    .cookie("sec", token, {
      ...cookiesOptions,
      expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    })
    .json({
      success: true,
      token: token,
      user: user,
      message: message,
    });
};

export const cookiesOptions = {
  secure: process.env.NODE_ENV === "Development" ? false : true,
  httpOnly: process.env.NODE_ENV === "Development" ? false : true,
  sameSite: process.env.NODE_ENV === "Development" ? false : "none",
};
