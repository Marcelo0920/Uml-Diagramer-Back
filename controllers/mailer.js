import nodemailer from "nodemailer";

export const sendMail = async (req, res, next) => {
  try {
    const { nombre, email, url } = req.body;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: {
        name: "PARCIAL 1 SOFTWARE 1",
        address: process.env.MAIL_USER,
      },
      to: [email],
      subject: "Te han invitado a colaborar en un proyecto!",
      text: `
        Mensaje: El usuario ${nombre} te esta invitando a trabajar con el!!,
        Url del Proyecto: ${url},
      `,
    };

    const sendMail = async (transporter, mailOptions) => {
      try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent");
      } catch (error) {
        console.error(error);
      }
    };

    sendMail(transporter, mailOptions);

    res.status(200).json({ mensaje: "Email enviado con exito" });
  } catch (error) {
    next(error);
  }
};
