import { Switch, Route } from "wouter";
import { queryClient } from "@common/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@common/components/ui/toaster";
import { TooltipProvider } from "@common/components/ui/tooltip";
import SimpleLanding from "@/pages/SimpleLanding";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={SimpleLanding} />
      <Route path="/search" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
