// Uncomment this line to use CSS modules
// import styles from './app.module.css';
import NxWelcome from "./nx-welcome";
import { AuthWidget } from "./auth-widget";

export function App() {
  return (
    <div>
      <AuthWidget />
      <NxWelcome title="@we-impact/we-impact"/>
    </div>
  );
}

export default App;


