import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Admin } from "./pages/Admin";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/management" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;
