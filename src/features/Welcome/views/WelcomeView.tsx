import { ROUTES } from "@shared/constants";
import { Link } from "react-router";

export default function WelcomeView() {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-800 flex-col gap-4">
      <h1 className="text-white text-xl font-bold">
        Mấy ông có thể xem các trang mẫu dưới đây, là các demo về 1 trang trong app, từ đó so sánh với project-structure để hiểu được cách đặt-để các thành phần
        <br/>
        Trang Grammar là trang thuộc về domain của mình
      </h1>
      <div className="flex items-center gap-2 justify-center">
        <Link
          className="border px-6 py-2 rounded border-white text-white hover:bg-white hover:text-gray-800 transition-colors"
          to={ROUTES.PRODUCTS}
        >
          Products
        </Link>
        <Link
          className="border px-6 py-2 rounded border-white text-white hover:bg-white hover:text-gray-800 transition-colors"
          to={ROUTES.POSTS}
        >
          Posts
        </Link>
        <Link
          className="border px-6 py-2 rounded border-white text-white hover:bg-white hover:text-gray-800 transition-colors"
          to={ROUTES.GRAMMAR}
        >
          Grammar
        </Link>
      </div>
    </div>
  );
}
