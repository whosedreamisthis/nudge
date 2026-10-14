import { beforeEach, describe, expect, it } from "vitest";
import { useSuggestWizard } from "./suggest-wizard-store";

const suggestion = {
  name: "Stretch",
  description: "",
  categoryId: "c1",
  icon: "🧘",
  frequency: "DAILY" as const,
  targetDaysPerWeek: 7,
};

const store = () => useSuggestWizard.getState();

describe("suggest wizard store", () => {
  beforeEach(() => store().openWizard());

  it("opens on step 1 with empty answers", () => {
    expect(store()).toMatchObject({ open: true, step: 1, suggestions: null, loading: false });
    expect(store().answers).toEqual({ goals: "", productive: "", struggles: "" });
  });

  it("moves between steps and keeps the answers", () => {
    store().setAnswer("goals", "Get fitter");
    store().next();
    store().setAnswer("productive", "Mornings");
    store().next();
    expect(store().step).toBe(3);

    store().next();
    expect(store().step).toBe(3);

    store().back();
    store().back();
    expect(store().step).toBe(1);
    store().back();
    expect(store().step).toBe(1);
    expect(store().answers).toMatchObject({ goals: "Get fitter", productive: "Mornings" });
  });

  it("shows the results, and Back from them returns to the questions", () => {
    store().next();
    store().next();
    const id = store().beginRequest();
    expect(store().loading).toBe(true);

    store().finishRequest(id, { suggestions: [suggestion] });
    expect(store()).toMatchObject({ loading: false, suggestions: [suggestion] });

    store().back();
    expect(store()).toMatchObject({ suggestions: null, step: 3 });
  });

  it("remembers which suggestions were added, until new ones arrive or it reopens", () => {
    const id = store().beginRequest();
    store().finishRequest(id, { suggestions: [suggestion] });

    store().markAdded("Stretch");
    expect(store().added).toEqual(["Stretch"]);

    const next = store().beginRequest();
    store().finishRequest(next, { suggestions: [suggestion] });
    expect(store().added).toEqual([]);

    store().markAdded("Stretch");
    store().openWizard();
    expect(store().added).toEqual([]);
  });

  it("keeps the error and the answers when a request fails", () => {
    store().setAnswer("goals", "Get fitter");
    const id = store().beginRequest();

    store().finishRequest(id, { error: "Could not get suggestions" });

    expect(store()).toMatchObject({ loading: false, error: "Could not get suggestions", suggestions: null });
    expect(store().answers.goals).toBe("Get fitter");
  });

  it("ignores a reply that arrives after cancelling", () => {
    const id = store().beginRequest();
    store().closeWizard();

    store().finishRequest(id, { suggestions: [suggestion] });

    expect(store()).toMatchObject({ open: false, loading: false, suggestions: null });
  });

  it("starts clean when opened again", () => {
    store().setAnswer("goals", "Old goal");
    store().next();
    store().closeWizard();

    store().openWizard();

    expect(store()).toMatchObject({ open: true, step: 1 });
    expect(store().answers.goals).toBe("");
  });
});
