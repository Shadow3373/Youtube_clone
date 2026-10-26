
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./HomePage";
import WatchPage from "./pages/WatchPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/watch/:videoId" element={<WatchPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
