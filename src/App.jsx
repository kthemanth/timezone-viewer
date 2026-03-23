import AppRoutes from "./routes/AppRoutes";
import { ToastProvider } from './components/ui/useToast.jsx'
import Toast from './components/ui/Toast'

export default function App() {
  return (
    <ToastProvider>
      <AppRoutes />
      <Toast />
    </ToastProvider>
  );
}
