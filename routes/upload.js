const router = require("express").Router();
const cloudinary = require("cloudinary");
const auth = require("../middleware/auth");
const authAdmin = require("../middleware/authAdmin");
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

//upload images to cloudinary

router.post("/upload", auth, authAdmin, (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json("No files were uploaded");
    }
    const file = req.files.file;
    if (file.size > 1024 * 1024) {
      removeTmp(file.tempFilePath);
      return res.status(400).json({ msg: "Image size is too large" });
    }

    if (file.mimetype !== "image/jpeg" && file.mimetype !== "image/png") {
      removeTmp(file.tempFilePath);

      return res.status(400).json({ msg: "File format is not supported" });
    }

    cloudinary.v2.uploader.upload(
      file.tempFilePath,
      { folder: "ecommerce" },
      async (err, result) => {
        if (err) throw err;
        removeTmp(file.tempFilePath);

        res.json({ public_id: result.public_id, url: result.secure_url });
      }
    );
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

//delete uploaded images to cloudinary

router.post("/destroy", auth, authAdmin, (req, res) => {
  try {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({ msg: "No image was selected" });
    }

    cloudinary.v2.uploader.destroy(public_id, (err, result) => {
      if (err) throw err;

      res.json({ msg: "Image Delected" });
    });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

const removeTmp = (path) => {
  fs.unlink(path, (err) => {
    if (err) throw err;
  });
};

module.exports = router;
