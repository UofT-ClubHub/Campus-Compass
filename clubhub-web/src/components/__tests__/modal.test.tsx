import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../modal';

// Mock/Stub components used in the Modal.tsx to test it easier
jest.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open, onOpenChange }: any) => (
    <div data-testid="dialog-root" data-open={open} onClick={() => onOpenChange?.(false)}>
      {children}
    </div>
  ),
  Portal: ({ children }: any) => <div data-testid="dialog-portal">{children}</div>,
  Overlay: ({ className, children }: any) => (
    <div data-testid="dialog-overlay" className={className}>
      {children}
    </div>
  ),
  Content: ({ className, children }: any) => (
    <div data-testid="dialog-content" className={className}>
      {children}
    </div>
  ),
  Title: ({ className, children }: any) => (
    <h2 data-testid="dialog-title" className={className}>
      {children}
    </h2>
  ),
  Description: ({ className, children }: any) => (
    <p data-testid="dialog-description" className={className}>
      {children}
    </p>
  ),
  Close: ({ asChild, children }: any) => {
    if (asChild) {
      return children;
    }
    return <button data-testid="dialog-close">{children}</button>;
  },
}));

describe('Modal Component', () => {
  const mockOnOpenChange = jest.fn();
  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    title: 'Test Modal',
    children: <div>Modal content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders modal when open is true', () => {
      render(<Modal {...defaultProps} />);

      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-portal')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('does not render modal when open is false', () => {
      render(<Modal {...defaultProps} open={false} />);

      const dialogRoot = screen.getByTestId('dialog-root');
      expect(dialogRoot).toHaveAttribute('data-open', 'false');
    });
  });

  describe('Close Button', () => {
    it('renders close button by default', () => {
      render(<Modal {...defaultProps} />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveClass('absolute', 'top-4', 'right-4', 'z-10', 'p-2', 'bg-black/60', 'text-white', 'rounded-full');
    });

    it('does not render close button when showCloseButton is false', () => {
      render(<Modal {...defaultProps} showCloseButton={false} />);

      const closeButton = screen.queryByRole('button');
      expect(closeButton).not.toBeInTheDocument();
    });

    it('renders close button when showCloseButton is true', () => {
      render(<Modal {...defaultProps} showCloseButton={true} />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('close button has hover effects', () => {
      render(<Modal {...defaultProps} />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toHaveClass('hover:bg-black/80', 'transition-colors');
    });
  });

  describe('Content Structure', () => {
    it('renders children content', () => {
      const customContent = <div data-testid="custom-content">Custom modal content</div>;
      render(<Modal {...defaultProps} children={customContent} />);

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.getByText('Custom modal content')).toBeInTheDocument();
    });
  });

  describe('Overlay', () => {
    it('renders overlay with correct styling', () => {
      render(<Modal {...defaultProps} />);

      const overlay = screen.getByTestId('dialog-overlay');
      expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50', 'bg-black/60', 'backdrop-blur-sm');
    });
  });

  describe('Interactions', () => {
    it('calls onOpenChange when dialog root is clicked', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} />);

      const dialogRoot = screen.getByTestId('dialog-root');
      await user.click(dialogRoot);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onOpenChange when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} />);

      const closeButton = screen.getByRole('button');
      await user.click(closeButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });



  describe('Edge Cases', () => {
    it('renders with empty title', () => {
      render(<Modal {...defaultProps} title="" />);

      const title = screen.getByTestId('dialog-title');
      expect(title).toHaveTextContent('');
    });

    it('renders with very long title', () => {
      const longTitle = 'This is a very long title that might cause layout issues if not handled properly';
      render(<Modal {...defaultProps} title={longTitle} />);

      const title = screen.getByTestId('dialog-title');
      expect(title).toHaveTextContent(longTitle);
    });

    it('renders with special characters in title', () => {
      const specialTitle = 'Modal with special chars: !@#$%^&*()';
      render(<Modal {...defaultProps} title={specialTitle} />);

      const title = screen.getByTestId('dialog-title');
      expect(title).toHaveTextContent(specialTitle);
    });
  });
});
