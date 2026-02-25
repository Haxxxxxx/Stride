import { RouterProvider } from "react-router";
import { router } from "./routes";

// Main app entry point
export default function App() {
  return <RouterProvider router={router} />;
}