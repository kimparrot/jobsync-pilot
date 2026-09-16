import { render, screen } from "@testing-library/react";
import Brand, { BrandMark, BRAND_NAME } from "@/components/Brand";

describe("Brand", () => {
  it("renders the Rolefield wordmark and a decorative mark", () => {
    const { container } = render(<Brand />);

    expect(screen.getByText(BRAND_NAME)).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden");
  });

  it("keeps an accessible name when the wordmark is hidden", () => {
    render(<Brand showWordmark={false} />);

    expect(screen.getByText(BRAND_NAME)).toHaveClass("sr-only");
  });
});

describe("BrandMark", () => {
  it("is decorative and uses the brand colour token", () => {
    const { container } = render(<BrandMark />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden");
    expect(svg).toHaveClass("text-brand");
    expect(svg).not.toHaveAttribute("tabindex");
  });
});
