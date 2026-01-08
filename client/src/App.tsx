import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import NewRestaurant from "./pages/NewRestaurant";
import NewEvaluation from "./pages/NewEvaluation";
import EvaluationResult from "./pages/EvaluationResult";
import History from "./pages/History";
import FinancialCalculator from "./pages/FinancialCalculator";
import Compare from "./pages/Compare";
import PrintReport from "./pages/PrintReport";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/restaurant/new" component={NewRestaurant} />
      <Route path="/evaluation/new/:restaurantId?" component={NewEvaluation} />
      <Route path="/evaluation/:id" component={EvaluationResult} />
      <Route path="/history" component={History} />
      <Route path="/calculator" component={FinancialCalculator} />
      <Route path="/compare" component={Compare} />
      <Route path="/print/:id" component={PrintReport} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
