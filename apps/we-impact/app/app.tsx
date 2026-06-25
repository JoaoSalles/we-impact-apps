// Uncomment this line to use CSS modules
// import styles from './app.module.css';
import NxWelcome from "./nx-welcome";
import { AuthControls } from "./auth/auth-controls";

export function App() {
  return (
    <div>
      <AuthControls />
      <NxWelcome title="@we-impact/we-impact"/>
    </div>
  );
}

export default App;


