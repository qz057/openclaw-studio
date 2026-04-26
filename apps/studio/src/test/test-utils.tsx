import { render, RenderOptions } from '@testing-library/react';

// Custom render function that can be extended with providers
export function renderWithProviders(
  ui: any,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { renderWithProviders as render };
