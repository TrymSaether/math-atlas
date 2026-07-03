import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSaveScheduler } from "./saveScheduler";

describe("save scheduler", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("keeps the existing 800ms debounce and runs only the latest save per slug", async () => {
    const scheduler = createSaveScheduler();
    const first = vi.fn();
    const second = vi.fn();

    scheduler.schedule("topology", first);
    await vi.advanceTimersByTimeAsync(799);
    scheduler.schedule("topology", second);
    await vi.advanceTimersByTimeAsync(799);

    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it("debounces different map slugs independently", async () => {
    const scheduler = createSaveScheduler();
    const topology = vi.fn();
    const fourier = vi.fn();

    scheduler.schedule("topology", topology, 20);
    scheduler.schedule("fourier_analysis", fourier, 40);
    await vi.advanceTimersByTimeAsync(20);
    expect(topology).toHaveBeenCalledOnce();
    expect(fourier).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(20);
    expect(fourier).toHaveBeenCalledOnce();
  });
});
