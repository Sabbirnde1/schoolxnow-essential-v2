import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";

interface MobileNavProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
}

export function MobileNav({ activeModule, setActiveModule }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const handleModuleChange = (module: string) => {
    setActiveModule(module);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden touch-target">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72">
        <AppSidebar activeModule={activeModule} setActiveModule={handleModuleChange} />
      </SheetContent>
    </Sheet>
  );
}
