import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SafeHTML } from './SafeHTML';

describe('SafeHTML', () => {
  it('should render safe HTML content', () => {
    render(<SafeHTML html="<b>Bold text</b>" />);
    expect(screen.getByText('Bold text')).toBeInTheDocument();
  });

  it('should strip dangerous script tags', () => {
    const { container } = render(
      <SafeHTML html='<script>alert("xss")</script><b>Safe</b>' />
    );
    expect(container.innerHTML).not.toContain('<script>');
    expect(screen.getByText('Safe')).toBeInTheDocument();
  });

  it('should allow links with href', () => {
    render(<SafeHTML html='<a href="https://example.com">Link</a>' />);
    const link = screen.getByText('Link');
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <SafeHTML html="<b>Text</b>" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should render as different elements', () => {
    const { container: divContainer } = render(
      <SafeHTML html="<b>Text</b>" as="div" />
    );
    expect(divContainer.querySelector('div')).toBeInTheDocument();

    const { container: spanContainer } = render(
      <SafeHTML html="<b>Text</b>" as="span" />
    );
    expect(spanContainer.querySelector('span')).toBeInTheDocument();

    const { container: pContainer } = render(
      <SafeHTML html="<b>Text</b>" as="p" />
    );
    expect(pContainer.querySelector('p')).toBeInTheDocument();
  });

  it('should handle empty string', () => {
    const { container } = render(<SafeHTML html="" />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it('should remove onclick handlers', () => {
    const { container } = render(
      <SafeHTML html='<div onclick="alert(1)">Click me</div>' />
    );
    expect(container.innerHTML).not.toContain('onclick');
  });
});
