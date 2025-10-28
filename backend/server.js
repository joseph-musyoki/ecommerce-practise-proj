import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';


import authRouter from './routes/auth.routes.js';
import productRouter from './routes/product.routes.js'
import cartRouter from './routes/cart.route.js'
import couponRouter from './routes/coupons.router.js'
import paymentRouter from './routes/payment.router.js'
import analyticsRouter from './routes/analytics.router.js'

import { connectDB } from './db/db.connect.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

const __dirname = path.resolve();

app.use(express.json({limit:"10mb"}));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/coupons', couponRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/analytics', analyticsRouter);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, "frontend", "dist")));
    app.get(/.*/, (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
    });
}

app.listen(PORT, () =>{
    console.log('Server is running on port http://localhost:' + PORT);
    connectDB();
});