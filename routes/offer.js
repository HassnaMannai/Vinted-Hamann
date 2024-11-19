const express = require("express");
const router = express.Router();
const fileupload = require("express-fileupload");
const cloudinary = require("cloudinary");

const Offer = require("../models/Offer");
const isAuthentificated = require("../middlewares/isAuthentificated");

const converToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

router.post(
  "/offer/publish",
  isAuthentificated,
  fileupload(),
  async (req, res) => {
    try {
      //console.log(req.headers.authorization);
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      //console.log(req.body);
      //console.log(req.files);
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ÉTAT: condition,
          },
          {
            COULEUR: color,
          },
          {
            EMPLACEMENT: city,
          },
        ],
        owner: req.user,
      });

      //console.log(newOffer);
      const result = await cloudinary.uploader.upload(
        converToBase64(req.files.picture)
      );
      newOffer.product_image = result;
      // console.log(result);
      await newOffer.save();
      res.json(newOffer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    const filters = {};
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }
    if (req.query.priceMin) {
      filters.product_price = {
        $gte: Number(req.query.priceMin),
      };
    }
    if (req.query.priceMax) {
      filters.product_price = {
        $lte: Number(req.query.priceMax),
      };
      if (filters.product_price) {
        filters.product_price.$lte = Number(req.query.priceMax);
      } else {
        filters.product_price = {
          $lte: Number(req.query.priceMax),
        };
      }
    }
    //console.log(filters.product_price);

    const sort = {};
    if (req.query.sort === "price-desc") {
      sort.product_price = -1;
    } else if (req.query.sort === "price-asc") {
      sort.product_price = 1;
    }

    let limit = 5;
    if (req.query.limit) {
      limit = req.query.limit;
    }

    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const skip = (page - 1) * limit;

    const results = await Offer.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    const count = await Offer.countDocuments(filters);

    res.json({ count: count, offers: results });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );
    res.json(offer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
