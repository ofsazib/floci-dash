// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import TagsEditor, { tagsToRecord, type TagRow } from "./TagsEditor";

function Harness({ initial, spy }: { initial: TagRow[]; spy: (t: TagRow[]) => void }) {
  const [tags, setTags] = useState(initial);
  return (
    <TagsEditor
      tags={tags}
      onChange={(t) => {
        spy(t);
        setTags(t);
      }}
    />
  );
}

describe("TagsEditor", () => {
  it("adds, edits and removes tags", () => {
    const spy = vi.fn();
    render(<Harness initial={[]} spy={spy} />);
    expect(screen.getByText("No tags are associated with the resource.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Add tag" }));
    fireEvent.change(screen.getByLabelText("Tag key 1"), { target: { value: "env" } });
    fireEvent.change(screen.getByLabelText("Tag value 1"), { target: { value: "dev" } });
    expect(spy).toHaveBeenLastCalledWith([{ key: "env", value: "dev" }]);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(spy).toHaveBeenLastCalledWith([]);
  });

  it("edits only the targeted row", () => {
    const spy = vi.fn();
    render(<Harness initial={[{ key: "a", value: "1" }, { key: "b", value: "2" }]} spy={spy} />);
    fireEvent.change(screen.getByLabelText("Tag value 2"), { target: { value: "3" } });
    expect(spy).toHaveBeenLastCalledWith([{ key: "a", value: "1" }, { key: "b", value: "3" }]);
  });

  it("disables Add tag at 50 tags", () => {
    const fifty = Array.from({ length: 50 }, (_, i) => ({ key: `k${i}`, value: "" }));
    render(<Harness initial={fifty} spy={vi.fn()} />);
    const add = screen.getByRole("button", { name: "Add tag" });
    expect(add.hasAttribute("disabled") || add.getAttribute("aria-disabled") === "true").toBe(true);
  });

  it("turns rows with keys into a record", () => {
    expect(tagsToRecord([{ key: " env ", value: "dev" }, { key: " ", value: "x" }])).toEqual({ env: "dev" });
    expect(tagsToRecord([])).toBeUndefined();
  });
});
