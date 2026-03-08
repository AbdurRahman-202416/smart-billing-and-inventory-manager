"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Package, 
  Tag, 
  Barcode, 
  Boxes, 
  History, 
  ExternalLink,
  ChevronRight,
  ShoppingCart,
  Plus,
  Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { foodApi } from "@/lib/axios";
import type { Product } from "@/types";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { inventory, addProduct, removeProduct } = useStore();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGlobal, setIsGlobal] = useState(false);

  useEffect(() => {
    const productId = params.id as string;
    
    // 1. Try to find in local inventory
    const localProduct = inventory.find(p => p.id === productId || p.barcode === productId);
    
    if (localProduct) {
      setProduct(localProduct);
      setLoading(false);
      return;
    }

    // 2. If not found locally, try to fetch from OpenFoodFacts (assuming id is a barcode)
    async function fetchGlobalProduct() {
      try {
        const { data } = await foodApi.get(`/product/${productId}.json`);
        if (data.status === 1 && data.product) {
          const p = data.product;
          const globalProd: Product = {
            id: productId, // Using barcode as ID for global ones
            sku: `GLOBAL-${productId}`,
            name: p.product_name || "Unknown Product",
            brand: p.brands,
            image: p.image_front_url || p.image_url,
            barcode: productId,
            price: 0, // No price as it's not in store
            stock: 0,
            unit: p.quantity || "",
            category: p.categories?.split(",")[0]?.trim() || "Uncategorized",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setProduct(globalProd);
          setIsGlobal(true);
        } else {
          setError("Product not found in local store or global database.");
        }
      } catch (err) {
        setError("Error fetching product details.");
      } finally {
        setLoading(false);
      }
    }

    fetchGlobalProduct();
  }, [params.id, inventory]);

  const handleAddToInventory = () => {
    if (product) {
      const newProduct: Product = {
        ...product,
        id: crypto.randomUUID(),
        price: 99, // Default price
        stock: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addProduct(newProduct);
      router.push("/inventory");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"></div>
        <p className="text-gray-500 font-medium">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center space-y-6 px-4">
        <div className="bg-red-50 p-8 rounded-3xl border border-red-100">
          <Package size={48} className="mx-auto text-red-200 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Oops! Product Not Found</h2>
          <p className="text-gray-500 mt-2">{error || "We couldn't find the product you're looking for."}</p>
        </div>
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:underline"
        >
          <ArrowLeft size={18} />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header / Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl hover:bg-white transition-colors group"
        >
          <ArrowLeft size={24} className="text-gray-400 group-hover:text-gray-800" />
        </button>
        <div className="flex gap-3">
          {isGlobal ? (
            <button
              onClick={handleAddToInventory}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all text-sm"
            >
              <Plus size={18} />
              Add to Store
            </button>
          ) : (
            <button
              onClick={() => router.push("/billing")}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 active:scale-95 transition-all text-sm"
            >
              <ShoppingCart size={18} />
              Open Billing
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Product Image */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 bg-white rounded-[2.5rem] p-8 aspect-square flex items-center justify-center border border-gray-100 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity" />
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={product.image} 
              alt={product.name} 
              className="max-h-full max-w-full object-contain mix-blend-multiply drop-shadow-2xl group-hover:scale-105 transition-transform duration-500" 
            />
          ) : (
            <Package size={120} className="text-gray-100" />
          )}
        </motion.div>

        {/* Right: Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-12 xl:col-span-7 flex flex-col pt-4"
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider rounded-full">
                <Tag size={12} />
                {product.category || "General"}
              </span>
              <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
                {product.name}
              </h1>
              {product.brand && (
                <p className="text-lg text-gray-400 font-medium">By <span className="text-gray-600">{product.brand}</span></p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 py-8 border-y border-gray-100">
              {!isGlobal && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-400">Current Price</p>
                  <p className="text-4xl font-black text-indigo-600 tabular-nums">Tk{product.price.toFixed(2)}</p>
                </div>
              )}
              
              {!isGlobal && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-400">Stock Available</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-800">{product.stock}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${product.stock > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              )}

              {product.unit && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-400">Net Weight / Size</p>
                  <p className="text-lg font-bold text-gray-700">{product.unit}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              {/* Technical Details */}
              <div className="p-6 bg-white rounded-3xl border border-gray-100 space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Barcode className="text-indigo-400" size={18} />
                  Identifiers
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Barcode (EAN)</span>
                    <span className="font-mono font-bold text-gray-800 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                      {product.barcode || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Store SKU</span>
                    <span className="font-mono font-bold text-gray-600">{product.sku}</span>
                  </div>
                </div>
              </div>

              {/* History/System Details */}
              <div className="p-6 bg-white rounded-3xl border border-gray-100 space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <History className="text-indigo-400" size={18} />
                  Timeline
                </h3>
                <div className="space-y-3 font-medium text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Added to Store</span>
                    <span className="text-gray-600">{new Date(product.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Store Status</span>
                    <span className={`flex items-center gap-1.5 ${isGlobal ? 'text-amber-500' : 'text-green-500'}`}>
                      <span className={`w-2 h-2 rounded-full ${isGlobal ? 'bg-amber-500' : 'bg-green-500'} animate-pulse`} />
                      {isGlobal ? 'Global Registry' : 'Active Inventory'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {product.barcode && (
              <a 
                href={`https://world.openfoodfacts.org/product/${product.barcode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 hover:border-indigo-400 hover:text-indigo-400 transition-all font-bold text-sm"
              >
                <ExternalLink size={16} />
                View on Open Food Facts Registry
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
