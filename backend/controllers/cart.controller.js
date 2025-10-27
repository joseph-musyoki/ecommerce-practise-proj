import { Product } from "../modal/product.model.js";

export const getCartProducts = async (req, res) => {
    try {
        // collect product ids from user's cart (cart items have shape { product: ObjectId, quantity: Number })
        const productIds = req.user.cart.map(item => item.product);
        const products = await Product.find({ _id: { $in: productIds } });

        const cartItems = products.map(product => {
            // match by stringified id since product.product is ObjectId
            const item = req.user.cart.find(cart => String(cart.product) === String(product._id));
            return { ...product.toJSON(), quantity: item ? item.quantity : 0 };
        });

        res.json(cartItems);
    } catch (error) {
        console.log("Error in getting all cart items", error.message);
        res.status(500).json({ message: "server error", error: error.message });
    }
}

export const addToCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;

        // find existing cart item by product ObjectId
        const existingItem = user.cart.find(item => String(item.product) === String(productId));
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 0) + 1;
        } else {
            user.cart.push({ product: productId, quantity: 1 });
        }
        await user.save();
        res.json({ message: "Product added to cart", cart: user.cart });
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const removeAllFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;
        if (!productId) {
            user.cart = [];
        } else {
            user.cart = user.cart.filter((item) => String(item.product) !== String(productId));
        }
        await user.save();
        res.json({ message: "Product removed from cart", cart: user.cart });
    } catch (error) {
        console.error("Error removing from cart:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const updateQuantity = async (req, res) => {
    const { id: productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;
    const existingItem = user.cart.find(item => String(item.product) === String(productId));

    try {
        if (existingItem) {
            if (quantity === 0) {
                user.cart = user.cart.filter(item => String(item.product) !== String(productId));
                await user.save();
                return res.json({ message: "Product removed from cart", cart: user.cart });
            }
            existingItem.quantity = quantity;
            await user.save();
            return res.json({ message: "Product quantity updated", cart: user.cart });
        } else {
            return res.status(404).json({ message: "Product not found in cart" });
        }
    } catch (error) {
        console.log("Error in updateQuantity", error.message);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}