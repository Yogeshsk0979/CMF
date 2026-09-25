import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <Dashboard />
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
