import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import { Home } from './pages/Home';
import './App.css';

export default function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            {/* other links */}
          </ul>
        </nav>

        {/* routes */}
        <Route path="/" exact component={Home} />
        {/* other routes */}
      </div>
    </Router>
  );
}
