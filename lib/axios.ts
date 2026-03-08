import axios from "axios";

export const foodApi = axios.create({
  baseURL: "https://world.openfoodfacts.org/api/v2",
  timeout: 70000,
});

export interface FoodApiProduct {
  product_name?: string;
  brands?: string;
  image_front_url?: string;
  image_url?: string;
  quantity?: string;
}

export interface FoodApiResponse {
  status: number;
  product?: FoodApiProduct;
}
