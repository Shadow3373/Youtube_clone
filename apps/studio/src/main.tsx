
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import AuthGate from "./components/AuthGate";
import ChannelGate from "./components/ChannelGate";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthGate>
      <ChannelGate>
        <App />
      </ChannelGate>
    </AuthGate>
  </StrictMode>,
);
