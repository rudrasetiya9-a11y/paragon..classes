import { Moon, Sun, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { name: "Light", value: "light", icon: Sun },
    { name: "Dark", value: "dark", icon: Moon },
    { name: "Ocean Blue", value: "blue", icon: Palette },
    { name: "Forest Green", value: "green", icon: Palette },
    { name: "Royal Purple", value: "purple", icon: Palette },
    { name: "Sunset Orange", value: "orange", icon: Palette },
  ];

  const currentTheme = themes.find(t => t.value === theme);
  const Icon = currentTheme?.icon || Palette;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-9 h-9 p-0"
        >
          <Icon className="h-4 w-4" />
          <span className="sr-only">Change theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.value}
            onClick={() => setTheme(themeOption.value as any)}
            className={theme === themeOption.value ? "bg-accent" : ""}
          >
            <themeOption.icon className="h-4 w-4 mr-2" />
            {themeOption.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}