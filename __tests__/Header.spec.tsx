import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import { SidebarProvider } from "@/context/SidebarContext";
import { APP_CONSTANTS } from "@/lib/constants";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/dashboard"),
}));

vi.mock("@/components/AgentChatTrigger", () => ({
  AgentChatTrigger: () => (
    <button type="button" aria-label="Open assistant">
      Chat AI
    </button>
  ),
}));

const renderHeader = () =>
  render(
    <SidebarProvider initialExpanded>
      <Header />
    </SidebarProvider>,
  );

describe("Header", () => {
  beforeEach(() => {
    document.cookie = `${APP_CONSTANTS.SIDEBAR_STORAGE_KEY}=; path=/; max-age=0`;
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/dashboard");
  });

  it("shows the Rolefield wordmark and workspace tagline", () => {
    renderHeader();

    expect(
      screen.getByRole("heading", { name: /Rolefield/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Job search workspace")).toBeInTheDocument();
  });

  it("keeps the assistant control in the top bar", () => {
    renderHeader();

    expect(
      screen.getByRole("button", { name: "Open assistant" }),
    ).toBeInTheDocument();
  });

  it("opens a mobile sheet with the existing routes and 44px rows", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: "Toggle Menu" }));

    const jobs = await screen.findByRole("link", { name: "Jobs" });
    expect(jobs).toHaveAttribute("href", "/dashboard/myjobs");
    expect(jobs).toHaveClass("min-h-11");
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(
      screen.queryByRole("link", { name: "Developer Options" }),
    ).not.toBeInTheDocument();
  });

  it("marks the current page in the mobile sheet", async () => {
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue(
      "/dashboard/tasks",
    );
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: "Toggle Menu" }));

    expect(await screen.findByRole("link", { name: "Tasks" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "Dashboard" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("uses a 44px hit area on the mobile menu trigger", () => {
    renderHeader();

    expect(screen.getByRole("button", { name: "Toggle Menu" })).toHaveClass(
      "h-11",
      "w-11",
    );
  });

  it("does not invent a search field", () => {
    renderHeader();

    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
  });
});
