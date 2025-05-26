// controllers/pathaoController.js
const axios = require("axios");

const pathaoConfig = {
  baseUrl: "https://api-hermes.pathao.com",
  clientId: "zPdyw97aQr",
  clientSecret: "CFxqOxslqGljMGstNfa6exgznw1rctK9WKiCJLn9",
  username: "hoktok.com.bd@gmail.com",
  password: "4r*h*hxT",
  storeId: 266276,
};

let accessToken = null;
let tokenExpiry = null;

const getPathaoToken = async () => {
  if (accessToken && tokenExpiry && new Date() < tokenExpiry) {
    return accessToken;
  }

  try {
    const response = await axios.post(
      `${pathaoConfig.baseUrl}/aladdin/api/v1/issue-token`,
      {
        client_id: pathaoConfig.clientId,
        client_secret: pathaoConfig.clientSecret,
        username: pathaoConfig.username,
        password: pathaoConfig.password,
        grant_type: "password",
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = new Date(Date.now() + 50 * 60 * 1000); // 50 mins
    return accessToken;
  } catch (error) {
    console.error("Pathao token error:", error.response?.data || error.message);
    throw new Error("Failed to authenticate with Pathao API");
  }
};

const createPathaoOrder = async (order) => {
  console.log("Creating Pathao order...", order);
  try {
    const token = await getPathaoToken();

    const pathaoOrder = {
      store_id: pathaoConfig.storeId,
      merchant_order_id: `ORDER-${Date.now()}`,
      recipient_name: "Anisur Rahman for test",
      recipient_phone: "01700000000",
      recipient_address: "Uttara, Dhaka",
      recipient_city: 1,
      recipient_zone: 3,
      recipient_area: 10,
      delivery_type: 48,
      item_type: 2,
      special_instruction: "",
      item_quantity: 1,
      item_weight: 0.5,
      item_description: "General Item",
      amount_to_collect: 0,
    };

    const response = await axios.post(
      `${pathaoConfig.baseUrl}/aladdin/api/v1/orders`,
      pathaoOrder,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 10000,
      }
    );

    console.log("✅ Pathao order created:", response);

    return res?.status(200).json({
      success: true,
      message: "✅ Pathao order created successfully",
      data: response.data,
    });
  } catch (error) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
    };

    let statusCode = 500;

    if (error.response) {
      statusCode = error.response.status || 500;
      errorDetails.response = {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      };
    } else if (error.request) {
      errorDetails.request = error.request;
    }

    return res.status(statusCode).json({
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Failed to create Pathao order",
      details: error.response?.data || null,
    });
  }
};

module.exports = {
  createPathaoOrder,
};
