import UserModel from "../model/User.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import otpGenerator from "otp-generator";

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
          .compare(password, user.password)
          .then((passwordCheck) => {
            if (!passwordCheck)
              return res.status(400).send({ error: "Don't have Password" });

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
  const { username } = req.params;

  try {
    if (!username) return res.status(501).send({ error: "Invalid Username" });

    UserModel.findOne({ username })
      .then((user) => {
        if (!user)
          return res.status(501).send({ error: "Couldn't Find the User" });

        /** remove password from user */
        // mongoose return unnecessary data with object so convert it into json
        const { password, ...rest } = Object.assign({}, user.toJSON());

        return res.status(201).send(rest);
      })
      .catch((error) => res.status(500).send({ error }));
  } catch (error) {
    return res.status(500).send({ error: "Cannot Find User Data" });
  }
}

export async function updateUser(req, res) {
  try {
    const { userId } = req.user;

    if (userId) {
      const body = req.body;

      //update the data
      UserModel.updateOne({ _id: userId }, body)
        .then(() => {
          // if (err) throw err;

          return res.status(201).send({ msg: "Record updated successfully" });
        })
        .catch((error) => res.status(500).send({ error }));
    } else {
      return res.status(401).send({ error: "User Not Found...!" });
    }
  } catch (error) {
    return res.status(401).send({ error });
  }
}

export async function generateOTP(req, res) {
  req.app.local.OTP = await otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  res.status(201).send({ code: req.app.local.OTP });
}
export async function verifyOTP(req, res) {
  const { code } = req.query;
  if (parseInt(req.app.local.OTP) === parseInt(code)) {
    req.app.locals.OTP = null; //reset the OTP value
    req.app.locals.resetSession = true; // start session for reset password
    return res.status(201).send({ msg: "Verify Successfully" });
  }
  return res.status(400).send({ error: "Invalid OTP" });
}

//successful redirect user when OTP is valid
export async function createResetSession(req, res) {
  if (req.app.locals.resetSession) {
    return res.status(201).send({ flag: req.app.locals.resetSession });
  }
  return res.status(440).send({ error: "Session expired!" });
}

//update the password when we have valid session
export async function resetPassword(req, res) {
  try {
    if (!req.app.locals.resetSession)
      return res.status(440).send({ error: "Session expired!" });

    const { username, password } = req.body;

    try {
      UserModel.findOne({ username })
        .then((user) => {
          bcrypt.hash(password, 10).then((hashedPassword) => {
            UserModel.updateOne(
              { username: user.username },
              { password: hashedPassword }
            )
              .then(() => {
                return res.status(201).send({ msg: "Password updated..." });
              })
              .catch((error) => res.status(500).send({ error }));
          });
        })
        .catch((error) => {
          return res.status(404).send({ error: "Username not found" });
        });
    } catch (error) {
      return res.status(403).send({ error });
    }
  } catch (error) {
    return res.status(401).send({ error });
  }
}
