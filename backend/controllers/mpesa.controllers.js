
import request from "request";
import 'dotenv/config';
import { getTimestamp } from "../utils/utils.timestamp.js";
import { Payment } from "../models/payment.models.js";

/**
 * @desc Initiate STK Push payment request to Safaricom
 * @method POST
 * @route /api/stkPush
 * @access Public
 */
export const initiateSTKPush = async (req, res) => {
    try {
        const { amount, phoneNumber, customerId } = req.body;
        const Order_ID = `order_${Date.now()}`;
        const url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
        const auth = "Bearer " + req.safaricom_access_token;

        const timestamp = getTimestamp();
        const password = Buffer.from(
            process.env.BUSINESS_SHORT_CODE + process.env.PASS_KEY + timestamp
        ).toString('base64');

        const callback_url = `${process.env.NGROK_URL}/api/stkPushCallback/${Order_ID}`;

        // Step 1: Save Pending transaction to database
        const payment = new Payment({
            customerId,
            paymentMethod: "M-Pesa",
            amount,
            phoneNumber,
            transactionId: Order_ID,
            status: "Pending",
        });

        await payment.save();

        // Step 2: Send STK Push request to Safaricom
        request({
            url,
            method: "POST",
            headers: { Authorization: auth },
            json: {
                BusinessShortCode: process.env.BUSINESS_SHORT_CODE,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerPayBillOnline",
                Amount: amount,
                PartyA: phoneNumber,
                PartyB: process.env.BUSINESS_SHORT_CODE,
                PhoneNumber: phoneNumber,
                CallBackURL: callback_url,
                AccountReference: "Wayne's Shop",
                TransactionDesc: "Online Payment",
            },
        }, async (error, response, body) => {
            if (error) {
                console.error("STK Push Error:", error);
                await Payment.findOneAndUpdate(
                    { transactionId: Order_ID },
                    { status: "Failed", providerResponse: error }
                );
                return res.status(503).json({ message: "STK Push request failed", error });
            }

            res.status(200).json({ message: "STK Push initiated successfully", data: body });
        });
    } catch (error) {
        console.error("Error initiating STK Push:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

/**
 * @desc Handle STK Push Callback from Safaricom
 * @method POST
 * @route /api/stkPushCallback/:Order_ID
 * @access Public
 */
export const stkPushCallback = async (req, res) => {
    try {
        const { Order_ID } = req.params;
        const {
            MerchantRequestID,
            CheckoutRequestID,
            ResultCode,
            ResultDesc,
            CallbackMetadata,
        } = req.body.Body.stkCallback;

        const status = ResultCode === 0 ? "Completed" : "Failed";

        // Extract metadata values
        const meta = Object.values(CallbackMetadata.Item);
        const PhoneNumber = meta.find(item => item.Name === 'PhoneNumber')?.Value.toString();
        const Amount = meta.find(item => item.Name === 'Amount')?.Value.toString();
        const MpesaReceiptNumber = meta.find(item => item.Name === 'MpesaReceiptNumber')?.Value.toString();
        const TransactionDate = meta.find(item => item.Name === 'TransactionDate')?.Value.toString();

        console.log(CallbackMetadata);

        // Step 1: Update Payment in the database
        const updatedPayment = await Payment.findOneAndUpdate(
            { transactionId: Order_ID },
            {
                status,
                updatedAt: Date.now(),
                providerResponse: {
                    MerchantRequestID,
                    CheckoutRequestID,
                    ResultCode,
                    ResultDesc,
                    MpesaReceiptNumber,
                    TransactionDate,
                    PhoneNumber,
                    Amount,
                },
            },
            { new: true }
        );
        

        if (!updatedPayment) {
            return res.status(404).json({ message: "Payment record not found" });
        }

        console.log("Callback Payment Updated:", updatedPayment);
        res.status(200).json({ message: "Transaction updated successfully", data: updatedPayment });
    } catch (error) {
        console.error("Error processing callback:", error);
        res.status(500).json({ message: "Error processing callback", error: error.message });
    }
};

/**
 * @desc Confirm payment status with Safaricom servers
 * @method GET
 * @route /api/confirmPayment/:CheckoutRequestID
 * @access Public
 */
export const confirmPayment = async (req, res) => {
    try {
        const { CheckoutRequestID } = req.params;
        const url = "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query";
        const auth = "Bearer " + req.safaricom_access_token;

        const timestamp = getTimestamp();
        const password = Buffer.from(
            process.env.BUSINESS_SHORT_CODE + process.env.PASS_KEY + timestamp
        ).toString('base64');

        // Step 1: Send request to Safaricom API to confirm payment status
        request({
            url,
            method: "POST",
            headers: { Authorization: auth },
            json: {
                BusinessShortCode: process.env.BUSINESS_SHORT_CODE,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID,
            },
        }, async (error, response, body) => {
            if (error) {
                console.error("Error confirming payment status:", error);
                return res.status(503).json({ message: "Failed to confirm payment status", error });
            }

            const { ResultCode, ResultDesc } = body;

            // Step 2: Update payment status based on ResultCode
            const status = ResultCode === "0" ? "Completed" : "Failed";
            const updatedPayment = await Payment.findOneAndUpdate(
                { "providerResponse.CheckoutRequestID": CheckoutRequestID },
                { status, updatedAt: Date.now(), providerResponse: body },
                { new: true }
            );

            if (!updatedPayment) {
                return res.status(404).json({ message: "Payment record not found" });
            }

            res.status(200).json({
                message: "Payment confirmation completed",
                data: updatedPayment,
            });
        });
    } catch (error) {
        console.error("Error confirming payment:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
