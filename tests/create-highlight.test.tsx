import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CreateHighlight } from "@/components/create-highlight";

async function openForm(onCreate = vi.fn()) {
  const user = userEvent.setup();
  render(<CreateHighlight onCreate={onCreate} />);
  await user.click(screen.getByRole("button", { name: "Create" }));
  return { user, onCreate };
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole("textbox", { name: /Highlight name/ }), "  Sunset  ");
  await user.type(screen.getByRole("textbox", { name: /Location/ }), " Vancouver ");
  await user.type(screen.getByRole("textbox", { name: /Description/ }), " A beautiful evening. ");
}

describe("create highlight dialog", () => {
  it("opens over the page, focuses the first field, and closes with Cancel", async () => {
    const { user } = await openForm();
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(screen.getByRole("textbox", { name: /Highlight name/ })).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  it("does not submit whitespace-only fields", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { user } = await openForm();
    await user.type(screen.getByRole("textbox", { name: /Highlight name/ }), "   ");
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(screen.getByText("Highlight name is required.")).toBeVisible();
    expect(screen.getByText("Location is required.")).toBeVisible();
    expect(screen.getByText("Description is required.")).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits trimmed fields and closes only after success", async () => {
    const highlight = { id: 10, title: "Sunset", location: "Vancouver", description: "A beautiful evening." };
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ highlight }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const { user, onCreate } = await openForm();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith(highlight));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      title: "Sunset", location: "Vancouver", description: "A beautiful evening.",
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  it("keeps the input and dialog open when the server rejects a save", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "Please try again." }, { status: 502 })));
    const { user, onCreate } = await openForm();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Please try again.");
    expect(screen.getByRole("textbox", { name: /Highlight name/ })).toHaveValue("  Sunset  ");
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(onCreate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled();
  });

  it("keeps input on a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline")));
    const { user } = await openForm();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("couldn’t confirm");
    expect(screen.getByRole("textbox", { name: /Description/ })).toHaveValue(" A beautiful evening. ");
  });

  it("blocks duplicate requests and cancellation while saving", async () => {
    let finish!: (response: Response) => void;
    const fetchMock = vi.fn().mockReturnValue(new Promise<Response>((resolve) => { finish = resolve; }));
    vi.stubGlobal("fetch", fetchMock);
    const { user, onCreate } = await openForm();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    const saving = screen.getByRole("button", { name: "Saving…" });
    expect(saving).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    await user.click(saving);
    fireEvent.submit(screen.getByRole("textbox", { name: /Highlight name/ }).closest("form")!);
    const event = new Event("cancel", { cancelable: true });
    fireEvent(screen.getByRole("dialog"), event);
    expect(event.defaultPrevented).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => finish(Response.json({ highlight: { id: 10, title: "Sunset", location: "Vancouver", description: "A beautiful evening." } })));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("clears a cancelled draft when opening a new form", async () => {
    const { user } = await openForm();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(screen.getByRole("textbox", { name: /Highlight name/ })).toHaveValue("");
  });
});
