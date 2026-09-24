import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueueProgress } from "@/components/queue/QueueProgress";

describe("QueueProgress", () => {
  it("tells the customer they are next when nobody is ahead", () => {
    render(<QueueProgress peopleAhead={0} />);
    expect(screen.getByText("You're next in line.")).toBeDefined();
  });

  it("uses singular wording for one person ahead", () => {
    render(<QueueProgress peopleAhead={1} />);
    expect(screen.getByText("1 person is ahead of you.")).toBeDefined();
  });

  it("uses plural wording for several people", () => {
    render(<QueueProgress peopleAhead={5} />);
    expect(screen.getByText("5 people are ahead of you.")).toBeDefined();
  });
});
