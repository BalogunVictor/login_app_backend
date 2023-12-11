import UserModel from "../model/User.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";

/** middleware for verify user */
export async function verifyUser(req, res, next) {
  try {
    const { username } = req.method == "GET" ? req.query : req.body;

    // check the user existance
    let exist = await UserModel.findOne({ username });
    if (!exist) return res.status(404).send({ error: "Can't find User!" });
    next();
  } catch (error) {
    return res.status(404).send({ error: "Authentication Error" });
  }
}

export async function register(req, res) {
  try {
    const { username, password, profile, email } = req.body;

    // check the existing user
    const existUsername = new Promise((resolve, reject) => {
      UserModel.findOne({ username })
        .then((err, user) => {
          if (err) reject(new Error(err));
          if (user) reject({ error: "Please use unique username" });

          resolve();
        })
        .catch((err) => reject({ error: "exist username findone error" }));
    });

    // check for existing email
    const existEmail = new Promise((resolve, reject) => {
      UserModel.findOne({ email })
        .then((err, email) => {
          if (err) reject(new Error(err));
          if (email) reject({ error: "Please use unique Email" });

          resolve();
        })
        .catch((err) => reject({ error: "exist email findone error" }));
    });

    Promise.all([existUsername, existEmail])
      .then(() => {
        if (password) {
          bcrypt
            .hash(password, 10)
            .then((hashedPassword) => {
              const user = new UserModel({
                username,
                password: hashedPassword,
                profile: profile || "",
                email,
              });

              // return save result as a response
              user
                .save()
                .then((result) =>
                  res.status(201).send({ msg: "User Register Successfully" })
                )
                .catch((error) => res.status(500).send({ error }));
            })
            .catch((error) => {
              return res.status(500).send({
                error: "Enable to hashed password",
              });
            });
        }
      })
      .catch((error) => {
        return res.status(500).send({ error });
      });
  } catch (error) {
    return res.status(500).send(error);
  }
}

export async function login(req, res) {
  const { username, password } = req.body;
  try {
    UserModel.findOne({ username })
      .then((user) => {
        bcrypt
          .compare(user.password, password)
          .then((passwordCheck) => {
            if (!passwordCheck) {
              return res.status(400).send({ error: "Dont have Password" });
            }

            //create jwt token
            const token = jwt.sign(
              {
                userId: user._id,
                username: user.username,
              },
              process.env.JWT_SECRET,
              { expiresIn: "24h" }
            );

            return res.status(200).send({
              msg: "Login Successful...!",
              username: user.username,
              token,
            });
          })
          .catch((error) => {
            return res.status(400).send({ error: "Invalid password" });
          });
      })
      .catch((error) => {
        res.status(404).send({ error: "Username not found" });
      });
  } catch (error) {
    return res.status(500).send({ error });
  }
}

export async function getUser(req, res) {
  res.json("getUser route");
}

export async function updateUser(req, res) {
  res.json("updateUser route");
}

export async function generateOTP(req, res) {
  res.json("generateOTP route");
}

export async function verifyOTP(req, res) {
  res.json("verifyOTP route");
}

//successful redirect user when OTP is valid
export async function createResetSession(req, res) {
  res.json("createResetSession route");
}

//update the password when we have valid session
export async function resetPassword(req, res) {
  res.json("resetPassword route");
}
