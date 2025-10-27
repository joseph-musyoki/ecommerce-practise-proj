import cloudinary from "../db/cloudinary.js";
import { redis } from "../db/redis.js";
import { Product } from "../modal/product.model.js"

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.json({products})
    } catch (error) {
        console.log("error in getting products",error.message);
        res.status(500).json({message:"server error", error:error.message})
    }
}

export const getFeaturedProducts = async (req, res) => {
    try {
        let featured = await redis.get("featured_products");
        if(featured){
            return res.json({products:JSON.parse(featured), source:"cache"})
        }
        featured = await Product.find({isFeatured:true}).lean();
        if(!featured){
            return res.status(404).json({message:"No featured products found"});
        }
        await redis.set("featured_products", JSON.stringify(featured));
        res.json(featured);
    } catch (error) {
        console.log("error in getting featured products",error.message);
        res.status(500).json({message:"server error", error:error.message})
    }
}

export const createProduct = async (req, res) => {
	try {
		const { name, description, price, image, category } = req.body;

		let cloudinaryResponse = null;

		if (image) {
			cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
		}

		const product = await Product.create({
			name,
			description,
			price,
			image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
			category,
		});

		res.status(201).json(product);
	} catch (error) {
		console.log("Error in createProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const deleteProduct = async (req, res) => {
    try {
        const {id} = req.params;
        const product=await Product.findById(id);
        if(!product){
            return res.status(404).json({message:"product not found"})
        }
        if(product.image){
            const publicId = product.image.split("/").pop().split(".")[0];
            try {
               await cloudinary.uploader.destroy(`products/${publicId}`); 
            } catch (error) {
               console.log("error in deleting product image from cloudinary",error.message);
            }
        }
        await Product.findByIdAndDelete(id); 
        res.json({message:"product deleted successfully"});
    } catch (error) {
        console.log("error in deleting product",error.message);
        res.status(500).json({message:"server error", error:error.message})
    }
}

export const getRecommendedProducts = async (req, res) => {
    try {
        const products = await Product.aggregate([
        {
            $sample:{size:3}
        },
        {
            $project:{
                _id:1,
                name:1,
                description:1,
                image:1,
                price:1
            }
        }
    ])
    res.json(products)
    } catch (error) {
        console.log("error in getting recommended products",error.message);
        res.status(500).json({message:"server error", error:error.message})
    }}
export const getProductsByCategory = async (req, res) => {
    const {category} = req.params;
    try {
       const products = await Product.find({category})
       res.json({products}) 
    } catch (error) {
        console.log("error in getting products by category",error.message);
        res.status(500).json({message:"server error", error:error.message})
    }
}

export const toggleFeaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if(!product){
            return res.status(404).json({message:"product not found"})
        }else{
            product.isFeatured = !product.isFeatured;
            const updatedProduct = await product.save();
            await updatedFeaturedProductCache();
            res.json(updatedProduct)
        }
        
    } catch (error) {
        console.log("Error in toggleFeaturedProduct controller",error.message);
        res.status(500).json({message:"server error",error:error.message})
    }
}

async function updatedFeaturedProductCache() {
    try {
        const featuredProducts = await Product.find({isFeatured:true}).lean(); 
        await redis.set("featured_products", JSON.stringify(featuredProducts));
    } catch (error) {
        console.log("error in updating cache");
    }
}