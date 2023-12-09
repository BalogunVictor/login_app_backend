import { Router } from "express";
const router = Router();

/** POST Method */
router.route("/register").post((req, res) => res.json()); //register user
router.route("/registerMail").post(); // send the email
router.route("/authenticate").post(); //authenticate user
router.route("/login").post(); //login in app

/** GET Method */
router.route("/user/:username").get(); //user with username
router.route("/generateOTP").get(); //generate random OTP
router.route("/verifyOTP").get(); //verify generated OTP
router.route("/createResetSession").get(); // reset all the variables

/** PUT Method */
router.route("/updateuser").put(); //is use to update the user profile
router.route("/resetPassword").put(); // use to reset the password

export default router;
