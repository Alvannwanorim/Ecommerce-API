const Users = require("../models/userModel");
const Payments = require("../models/paymentModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userCtrl = {
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const user = await Users.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: " User already exist" });
      }
      if (password.length < 6) {
        return res.status(400).json({
          msg: "Password is too short, must be atleast 6 characters long",
        });
      }
      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = new Users({ name, email, password: passwordHash });
      await newUser.save();

      const accessToken = createAccessToken({ id: newUser._id });
      const refreshtoken = createRefreshToken({ id: newUser._id });

      res.cookie("refreshtoken", refreshtoken, {
        httpOnly: true,
        path: "/user/refresh_token",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ accessToken });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await Users.findOne({ email });

      if (!user) {
        return res.status(400).json({ msg: " User does not exist" });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ msg: " Incorrect password" });
      }
      const accessToken = createAccessToken({ id: user._id });
      const refreshtoken = createRefreshToken({ id: user._id });

      res.cookie("refreshtoken", refreshtoken, {
        httpOnly: true,
        path: "/user/refresh_token",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ accessToken });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  logout: async (req, res) => {
    try {
      res.clearCookie("refreshtoken", { path: "/user/refresh_token" });
      return res.json({ msg: "Logged out" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  refreshToken: (req, res) => {
    try {
      const rf_token = req.cookies.refreshtoken;
      //   res.json({ rf_token });

      if (!rf_token) {
        return res.status(400).json({ msg: "Please Login or Resgister" });
      }

      jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
          return res.status(400).json({ msg: "Please Login or Resgister" });
        }

        const accessToken = createAccessToken({ id: user.id });

        res.json({ accessToken });
      });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  getUser: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id).select("-password");
      if (!user) {
        return res.status(400).json({ msg: "User does not exist." });
      }
      res.json(user);
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  addCart: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id);
      if (!user) {
        return res.status(400).json({ msg: "User doe not exist" });
      }
      await Users.findOneAndUpdate(
        { _id: req.user.id },
        { cart: req.body.cart }
      );

      return res.json({ msg: "added to cart" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  history: async (req, res) => {
    try {
      const hsitory = await Payments.find({ user_id: req.user.id });
      res.json(hsitory);
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
};

const createAccessToken = (user) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "11m" });
};

const createRefreshToken = (user) => {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

module.exports = userCtrl;
