const Order = require("../models/Order.model");
const Site = require("../models/Site.model");
const Supplier = require("../models/Supplier.model");

//get Order List
const getOrderList = async (req, res) => {
  try {
    const orderList = await Order.find().populate("site");

    if (!orderList) {
      return res.send("No orders!");
    }
    res.json(orderList);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Server Error");
  }
};

//add Order by Site Manager
const addOrderBySiteManager = async (req, res) => {
  const { placedDate, requiredDate, productList, totalPrice, siteName } =
    req.body;
  const isDraft = true;
  const approvalStatus = false;
  const isRestricted = false;
  const status = totalPrice <= 100000 ? "approved" : "waiting";
  const site = await Site.findById(req.params.id);

  if (!site) return res.send("Some Data fields are not found!");

  try {
    const order = new Order({
      isDraft,
      placedDate,
      requiredDate,
      siteName,
      approvalStatus,
      isRestricted,
      productList,
      status,
      totalPrice,
      site: req.params.id,
    });

    const newOrder = await order.save();

    site.orderList.unshift(newOrder._id);

    await Site.findByIdAndUpdate(
      { _id: req.params.id },
      { $push: { orderList: newOrder._id } },
      { new: true } // This ensures that the updated site document is returned
    );

    for (let i = 0; i < productList.length; i++) {
      await Supplier.findByIdAndUpdate({
        _id: productList[i].supplier,
      }).then((sup) => {
        sup.orderList.unshift({
          product: productList[i].product,
          site: site._id,
          quantity: productList[i].qnty,
          requiredDate: requiredDate,
          orderRef: newOrder._id,
          supplierName: productList[i].supplierName,
        });
        sup.save();
      });
    }

    res.json({ message: "successful!" });
  } catch (err) {
    return res.status(500).send("Server Error");
  }
};

//update orderBy site manager
const updateOrderBySiteManager = async (req, res) => {
  const orderId = req.params.id; // Assuming you have a route parameter for the order ID
  const { placedDate, requiredDate, productList, totalPrice, siteName } =
    req.body;
  const status = totalPrice <= 100000 ? "placed" : "waiting";

  try {
    // Update the order by its ID
    const updatedOrder = await Order.findByIdAndUpdate(orderId, {
      placedDate,
      requiredDate,
      siteName,
      productList,
      status,
      totalPrice,
    });

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order updated successfully", updatedOrder });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

//getOrderBy Id
const getOrderByOrderId = async (req, res) => {
  const id = req.params.id;

  try {
    const order = await Order.findById(id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    return res.json({ success: true, order });
  } catch (error) {
    console.error("Error fetching order by order ID:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getOrdersBySite = async (req, res) => {
  const orders = await Order.find({ site: req.params.id }).populate("site");

  if (!orders) return res.send("No order list to this site!");

  res.json(orders);
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id, status } = req.body;

    console.log("inside order controller >", req.body);

    const existingOrder = await Order.findOne({ _id: id });

    if (!existingOrder) {
      return res.send("Order not found!");
    }

    existingOrder.status = status;

    existingOrder
      .save()
      .then((res) => {
        res.json("Update success!");
      })
      .catch((error) => {
        res.json({ message: error.message });
      });
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getOrderList,
  addOrderBySiteManager,
  updateOrderBySiteManager,
  getOrderByOrderId,
  getOrdersBySite,
  updateOrderStatus,
};
