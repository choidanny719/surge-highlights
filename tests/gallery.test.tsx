import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HighlightGallery } from "@/components/highlight-gallery";
import { HighlightGrid } from "@/components/highlight-grid";
import { HighlightPhoto } from "@/components/highlight-photo";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const highlights = [
  { id: 1, title: "First memory", location: "Vancouver", description: "A good day." },
  { id: 2, title: "Second memory", location: "Vancouver", description: "Another good day." },
];

describe("gallery", () => {
  it("renders an empty state and still allows creation", () => {
    render(<HighlightGallery initialHighlights={[]} />);
    expect(screen.getByText("No highlights yet. Share the first one!")).toBeVisible();
    expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();
  });

  it("shows a retry action after a loading failure", async () => {
    refresh.mockClear();
    const user = userEvent.setup();
    render(<HighlightGallery initialHighlights={[]} loadFailed />);
    expect(screen.getByRole("alert")).toHaveTextContent("couldn’t load");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("prepends the created highlight without reordering the existing records", async () => {
    const created = { id: 10, title: "Newest memory", location: "Burnaby", description: "A new day." };
    vi.stubGlobal("fetch", vi.fn(async (url) => url === "/api/highlights"
      ? Response.json({ highlight: created }, { status: 201 })
      : Response.json({ photo: null })));
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<HighlightGallery initialHighlights={highlights} />);
    await user.click(screen.getByRole("button", { name: "Create" }));
    await user.type(screen.getByRole("textbox", { name: /Highlight name/ }), created.title);
    await user.type(screen.getByRole("textbox", { name: /Location/ }), created.location);
    await user.type(screen.getByRole("textbox", { name: /Description/ }), created.description);
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(3));
    const titles = screen.getAllByRole("article").map((card) => within(card).getByRole("heading").textContent);
    expect(titles).toEqual(["Newest memory", "First memory", "Second memory"]);
  });

  it("reflows cards across three, two, and one columns without changing DOM order", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ photo: null })));
    let resize!: () => void;
    vi.stubGlobal("ResizeObserver", class {
      constructor(callback: () => void) { resize = callback; }
      observe() {}
      disconnect() {}
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      height: 200, width: 300, top: 0, left: 0, right: 300, bottom: 200, x: 0, y: 0, toJSON: () => ({}),
    });
    const items = Array.from({ length: 6 }, (_, index) => ({ ...highlights[0], id: index, title: `Memory ${index + 1}` }));
    render(<HighlightGrid highlights={items} />);
    await act(async () => {});
    const grid = screen.getByRole("list");
    grid.style.setProperty("--columns", "3");
    act(() => resize());
    const cells = screen.getAllByRole("listitem");
    expect(cells[3].style.gridArea).toBe("225 / 1 / span 224 / span 1");
    grid.style.setProperty("--columns", "2");
    act(() => resize());
    expect(cells[2].style.gridArea).toBe("225 / 1 / span 224 / span 1");
    grid.style.setProperty("--columns", "1");
    act(() => resize());
    expect(cells[1].style.gridArea).toBe("225 / 1 / span 224 / span 1");
    expect(screen.getAllByRole("heading").map((heading) => heading.textContent)).toEqual(items.map((item) => item.title));
  });
});

describe("highlight photos", () => {
  it("omits the image when no search result is available", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ photo: null })));
    const { container } = render(<HighlightPhoto title="Unknown" location="Somewhere" />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("omits a failed image while preserving the rest of the card", async () => {
    const photo = {
      url: "https://upload.wikimedia.org/memory.jpg", title: "Memory photo", creator: "Alex",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Memory.jpg", license: "CC BY 4.0", licenseUrl: null,
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ photo })));
    render(<HighlightGrid highlights={[highlights[0]]} />);
    const image = await screen.findByRole("img");
    fireEvent.error(image);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "First memory" })).toBeVisible();
  });
});
