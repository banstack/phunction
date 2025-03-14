import { BrowserRouter as Router } from "react-router-dom";
import { AppRoutes } from "./routes";
import { UserProvider } from "./context/UserContext";
import "./App.css";

function App() {
  return (
    <Router>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </Router>
  );
}

export default App;
