import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type BreadcrumbItem = {
  id: string;
  name: string;
  level: "college" | "department" | "year" | "section";
};

interface HierarchyBreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (index: number) => void;
}

export function HierarchyBreadcrumb({ items, onNavigate }: HierarchyBreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-6">
      <Button
        variant="ghost"
        onClick={() => onNavigate(-1)}
        className="text-primary hover:text-primary/80"
      >
        Home
      </Button>
      {items.map((item, index) => (
        <div key={item.id} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button
            variant={index === items.length - 1 ? "default" : "ghost"}
            onClick={() => onNavigate(index)}
            className={index === items.length - 1 ? "" : "text-primary hover:text-primary/80"}
          >
            {item.name}
          </Button>
        </div>
      ))}
    </div>
  );
}
