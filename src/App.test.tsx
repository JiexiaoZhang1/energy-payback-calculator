import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { calculateSavings } from "./lib/calculations";

describe("App flow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.stubGlobal("fetch", vi.fn(mockFetch));
  });

  it("moves from inputs to results", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Calculate payback" }));

    expect(await screen.findByRole("heading", { name: "Estimated payback time" })).toBeInTheDocument();
    expect(screen.getByText("Calculated by the backend")).toBeInTheDocument();
  });

  it("switches language and currency without losing the calculation flow", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Language"), { target: { value: "de" } });
    expect(screen.getByRole("heading", { name: "Amortisation in 2 Minuten" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Währung"), { target: { value: "EUR" } });
    fireEvent.click(screen.getByRole("button", { name: "Amortisation berechnen" }));

    expect(await screen.findByRole("heading", { name: "Geschätzte Amortisationszeit" })).toBeInTheDocument();
    expect(screen.getAllByText(/€/).length).toBeGreaterThan(0);
  });

  it("opens tariff editing, adds and deletes a price period, and keeps 24:00 readable", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: /17:00-24:00/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /00:00-06:00/ }));
    expect(screen.getByRole("heading", { name: "00:00-06:00" })).toBeInTheDocument();
    expect(screen.getByLabelText("Price per kWh")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Price per kWh"), { target: { value: "-0.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("button", { name: /00:00-06:00/ })).toHaveTextContent("-0.5");

    fireEvent.click(screen.getByRole("button", { name: "Add period" }));
    expect(screen.getByText("New period")).toBeInTheDocument();
    const priceInputs = screen.getAllByLabelText("Price per kWh");
    fireEvent.change(priceInputs[priceInputs.length - 1], { target: { value: "-0.75" } });
    const saveButtons = screen.getAllByRole("button", { name: "Save" });
    fireEvent.click(saveButtons[saveButtons.length - 1]);
    expect(screen.getByRole("button", { name: /-0.75/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /-0.75/ }));
    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    fireEvent.click(removeButtons[removeButtons.length - 1]);
    expect(screen.getByRole("button", { name: "Add period" })).toBeInTheDocument();
  });

  it("toggles every device and opens advanced parameters", () => {
    render(<App />);

    for (const name of [
      "Home battery",
      "Heat pump / hot water",
      "EV charging",
      "Timed appliances",
    ]) {
      fireEvent.click(screen.getByRole("button", { name }));
      expect(screen.getByRole("button", { name })).toHaveAttribute("aria-pressed", "false");
      fireEvent.click(screen.getByRole("button", { name }));
      expect(screen.getByRole("button", { name })).toHaveAttribute("aria-pressed", "true");
    }

    fireEvent.click(screen.getByRole("button", { name: "Advanced parameters" }));
    expect(screen.getByText("Battery round-trip efficiency")).toBeInTheDocument();
    expect(screen.getByText("95%")).toBeInTheDocument();
    expect(screen.getByText("Full charge/discharge cycles per day")).toBeInTheDocument();
    expect(screen.getByText(/1 cycle means using the full usable capacity once/)).toBeInTheDocument();
    expect(screen.getByText("Optional cost split")).toBeInTheDocument();
  });

  it("generates a share image from the result screen", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Calculate payback" }));
    expect(await screen.findByRole("heading", { name: "Estimated payback time" })).toBeInTheDocument();

    const downloadClick = vi.fn();
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const element = document.createElementNS(
        "http://www.w3.org/1999/xhtml",
        tagName,
      ) as HTMLElement & Partial<HTMLCanvasElement> & Partial<HTMLAnchorElement>;

      if (tagName === "canvas") {
        const canvasMock = element as unknown as {
          getContext: () => unknown;
          toBlob: (callback: BlobCallback) => void;
        };
        canvasMock.getContext = () => fakeCanvasContext();
        canvasMock.toBlob = (callback: BlobCallback) =>
          callback(new Blob(["png"], { type: "image/png" }));
      }

      if (tagName === "a") {
        (element as unknown as { click: () => void }).click = downloadClick;
      }

      return element as HTMLElement;
    });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:test"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });

    fireEvent.click(screen.getByRole("button", { name: "Share image" }));

    expect(await screen.findByText("Share link copied and image generated")).toBeInTheDocument();
    expect(screen.getByLabelText("Share link")).toBeInTheDocument();
    expect(downloadClick).toHaveBeenCalled();
  });
});

async function mockFetch(input: RequestInfo | URL, init?: RequestInit) {
  const url = String(input);
  const body = init?.body ? JSON.parse(String(init.body)) : {};

  if (url.includes("/api/calculate")) {
    return Response.json({ result: calculateSavings(body.state), source: "server" });
  }

  if (url.includes("/api/scenarios") && init?.method === "POST") {
    const scenario = {
      id: "test1234",
      createdAt: new Date(0).toISOString(),
      state: body.state,
      result: body.result ?? calculateSavings(body.state),
    };
    return Response.json({ scenario, id: scenario.id }, { status: 201 });
  }

  return Response.json({ error: "not found" }, { status: 404 });
}

function fakeCanvasContext() {
  return {
    beginPath: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    stroke: vi.fn(),
    measureText: (text: string) => ({ width: text.length * 12 }),
    set fillStyle(_value: string) {},
    set font(_value: string) {},
    set lineWidth(_value: number) {},
    set strokeStyle(_value: string) {},
  };
}
