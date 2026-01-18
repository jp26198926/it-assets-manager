"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User as UserIcon, X } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { Separator } from "@/components/ui/separator";

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    router.push("/login");
    router.refresh();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "manager":
        return "default";
      default:
        return "secondary";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Button
        variant="ghost"
        className="relative h-10 w-10 rounded-full neo-flat neo-hover"
        onClick={() => setOpen(true)}
      >
        <Avatar className="h-10 w-10 glass">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border neo-raised backdrop-blur-none">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              User Profile
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            <Avatar className="h-20 w-20 glass">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-2xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col items-center space-y-2 text-center">
              <p className="text-lg font-medium leading-none">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge
                variant={getRoleBadgeVariant(user.role)}
                className="mt-2 neo-flat"
              >
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-2 py-2">
            <Button
              variant="outline"
              className="w-full justify-start neo-flat neo-hover"
              onClick={() => {
                setOpen(false);
                router.push("/profile");
              }}
            >
              <UserIcon className="mr-2 h-4 w-4" />
              View Profile
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive neo-flat neo-hover"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
