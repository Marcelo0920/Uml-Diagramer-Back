import {
  comparePassword,
  decodeToken,
  encryptPassword,
} from "../middlewares/bcrypt.js";
import { User } from "../models/User.js";
import ErrorHandler from "../utils/error.js";
import { sendToken } from "../utils/features.js";

//@desc POST USER
//@access Anyone
export const postUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: "El usuario ya existe" });
    }

    console.log("encryting password");
    console.log(password);

    const encryptedPassword = await encryptPassword(password);

    const newUser = await new User({
      name,
      email,
      password: encryptedPassword,
    }).save();

    res.status(202).json({ msg: "Usuario creado con exito" });
  } catch (error) {
    next(error);
  }
};

//@desc LOGIN User
//@access User

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        error: { msg: "El correo o la password son incorrectos" },
      });
    }

    //verify if pass is ok
    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return next(new ErrorHandler("El correo o la password son incorrectos"));
    }

    const payload = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    };

    sendToken(res, `Bienvenido ${user.name}`, 200, user, payload);
  } catch (error) {
    return next(new ErrorHandler("Hubo un problema, intente mas tarde"));
  }
};

//LOAD USER
export const loadUser = async (req, res, next) => {
  try {
    const token = req.headers["sec"];

    const decodedToken = await decodeToken(token);
    const user = await User.findById(decodedToken.user.id).select("-password");

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler("Hubo un problema, intente mas tarde"));
  }
};
