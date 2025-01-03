
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
    {
        customerId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Customer', 
            required: false ,
        },
        paymentMethod: {
            type: String,
            enum: ['M-Pesa', 'Airtel', 'Paystack', 'Paysii'],
            required: true
        },
        amount: { 
            type: Number, 
            required: true 
        },
        phoneNumber: {
            type: String,
            required: function() {
                return ['M-Pesa', 'Airtel'].includes(this.paymentMethod);
            }
        },
        email: {
            type: String,
            required: function() {
                return ['Paystack', 'Paysii'].includes(this.paymentMethod);
            }
        },
        transactionId: { 
            type: String, 
            required: true 
        },
        providerResponse: { 
            type: Object, 
            default: {} 
        },
        status: { 
            type: String, 
            enum: ['Pending', 'Completed', 'Failed'], 
            default: 'Pending' 
        },
        createdAt: { 
            type: Date, 
            default: Date.now 
        },
        updatedAt: { 
            type: Date, 
            default: Date.now 
        }
    },
    { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
