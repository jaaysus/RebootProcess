import ReactDOM from 'react-dom/client';
import './index.css';
import "bootswatch/dist/pulse/bootstrap.min.css";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux'
import { store } from './redux/store'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
);
