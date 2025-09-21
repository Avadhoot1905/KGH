"use client";

import { useEffect, useState } from "react";

type Props = {
  initialTab?: "orders" | "viewed";
};

export default function ProfileToggleClient({ initialTab = "orders" }: Props) {
  const [active, setActive] = useState<"orders" | "viewed">(initialTab);

  useEffect(() => {
    const orders = document.getElementById("orders-section");
    const viewed = document.getElementById("viewed-section");
    if (!orders || !viewed) return;
    if (active === "orders") {
      orders.classList.remove("hiddenPane");
      viewed.classList.add("hiddenPane");
    } else {
      viewed.classList.remove("hiddenPane");
      orders.classList.add("hiddenPane");
    }
  }, [active]);

  return (
    <div className="profileToggle">
      <button
        className={`btn ${active === "orders" ? "primary" : "outline"}`}
        onClick={() => setActive("orders")}
      >
        Recent Orders
      </button>
      <button
        className={`btn ${active === "viewed" ? "primary" : "outline"}`}
        onClick={() => setActive("viewed")}
        style={{ marginLeft: 8 }}
      >
        Recently Viewed
      </button>
    </div>
  );
}


