"use client";

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  title: string;
  className?: string;
  showCloseButton?: boolean;
  backgroundClass?: string;
}

export function Modal({ 
  open, 
  onOpenChange, 
  children, 
  title,
  className = "",
  showCloseButton = true,
  backgroundClass = "bg-card"
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}>
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <Dialog.Description className="sr-only">
            {title} details and information
          </Dialog.Description>
          <div className={`relative ${backgroundClass} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            {showCloseButton && (
              <Dialog.Close asChild>
                <button className="absolute top-4 right-4 z-10 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors border-2 border-white/70">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            )}
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 