"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

export function Drawer({open,onOpenChange,title,children,className}:{open:boolean;onOpenChange:(open:boolean)=>void;title:string;children:React.ReactNode;className?:string}){
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[70] bg-ink/50 backdrop-blur-sm"/>
      <Dialog.Content className={cn("fixed inset-y-0 right-0 z-[71] w-[min(88vw,380px)] overflow-y-auto bg-surface text-fg shadow-3",className)} aria-describedby={undefined}>
        <Dialog.Title className="sr-only">{title}</Dialog.Title>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
