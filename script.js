const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.documentElement.classList.add("js-enabled");

function initNetworkField() {
  const canvas = document.querySelector("[data-network-field]");
  if (!canvas || reducedMotion) return;

  const ctx = canvas.getContext("2d");
  const pointer = { x: 0, y: 0 };
  const nodes = [];
  const sparks = [];
  let width = 0;
  let height = 0;
  let frame = 0;
  let lastDraw = 0;
  let visible = !document.hidden;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    nodes.length = 0;
    sparks.length = 0;
    const count = Math.min(72, Math.max(34, Math.floor((width * height) / 26000)));
    for (let index = 0; index < count; index += 1) {
      const cluster = index % 4;
      const anchorX = [0.16, 0.38, 0.64, 0.84][cluster] * width;
      const anchorY = [0.24, 0.68, 0.32, 0.76][cluster] * height;
      nodes.push({
        x: anchorX + (Math.random() - 0.5) * width * 0.34,
        y: anchorY + (Math.random() - 0.5) * height * 0.30,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        size: Math.random() * 2.1 + 1.5,
        phase: Math.random() * Math.PI * 2,
      });
    }

    for (let index = 0; index < 8; index += 1) {
      sparks.push({
        from: Math.floor(Math.random() * nodes.length),
        to: Math.floor(Math.random() * nodes.length),
        progress: Math.random(),
        speed: Math.random() * 0.0025 + 0.0015,
      });
    }
  }

  function draw(time = 0) {
    if (!visible) {
      requestAnimationFrame(draw);
      return;
    }

    if (time - lastDraw < 33) {
      requestAnimationFrame(draw);
      return;
    }

    lastDraw = time;
    frame += 1;
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";

    const pointerPullX = (pointer.x - width / 2) * 0.000018;
    const pointerPullY = (pointer.y - height / 2) * 0.000018;

    nodes.forEach((node, index) => {
      node.x += node.vx + Math.sin(frame * 0.006 + node.phase) * 0.045 + pointerPullX;
      node.y += node.vy + Math.cos(frame * 0.007 + node.phase) * 0.045 + pointerPullY;

      if (node.x < -20) node.x = width + 20;
      if (node.x > width + 20) node.x = -20;
      if (node.y < -20) node.y = height + 20;
      if (node.y > height + 20) node.y = -20;

      if (index % 23 === 0) {
        node.vx += (Math.random() - 0.5) * 0.006;
        node.vy += (Math.random() - 0.5) * 0.006;
        node.vx = Math.max(-0.18, Math.min(0.18, node.vx));
        node.vy = Math.max(-0.18, Math.min(0.18, node.vy));
      }
    });

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance > 145) continue;

        const alpha = (1 - distance / 145) * 0.26;
        ctx.shadowColor = "rgba(56, 223, 255, 0.20)";
        ctx.shadowBlur = 6;
        ctx.strokeStyle = `rgba(56, 223, 255, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    sparks.forEach((spark) => {
      const from = nodes[spark.from];
      const to = nodes[spark.to];
      if (!from || !to) return;
      spark.progress += spark.speed;
      if (spark.progress > 1) {
        spark.from = Math.floor(Math.random() * nodes.length);
        spark.to = Math.floor(Math.random() * nodes.length);
        spark.progress = 0;
        return;
      }

      const x = from.x + (to.x - from.x) * spark.progress;
      const y = from.y + (to.y - from.y) * spark.progress;
      ctx.shadowColor = "rgba(44, 169, 255, 0.82)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "rgba(193, 244, 255, 0.72)";
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    nodes.forEach((node, index) => {
      const pulse = (Math.sin(frame * 0.026 + node.phase + index) + 1) / 2;
      ctx.shadowColor = "rgba(44, 169, 255, 0.78)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = `rgba(44, 169, 255, ${0.46 + pulse * 0.22})`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(206, 247, 255, ${0.20 + pulse * 0.18})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
  });
  window.addEventListener("mousemove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });

  resize();
  draw();
}

function initInteractiveDemo() {
  const graph = document.querySelector("[data-demo-graph]");
  const tooltip = document.querySelector("[data-node-tooltip]");
  const title = document.querySelector("[data-inspect-title]");
  const source = document.querySelector("[data-inspect-source]");
  const destination = document.querySelector("[data-inspect-destination]");
  const latency = document.querySelector("[data-inspect-latency]");
  const feedLine = document.querySelector("[data-feed-line]");
  const replayHead = document.querySelector("[data-replay-head]");
  const replayButton = document.querySelector("[data-replay]");
  const assistantButton = document.querySelector("[data-assistant]");
  const nodes = document.querySelectorAll(".graph-node");
  if (!graph) return;

  const details = {
    "Player Input": {
      source: "StarterPlayer.InputCtrl",
      destination: "ReplicatedStorage.EquipWeapon",
      latency: "18ms",
      payload: "inputState, equippedSlot",
    },
    "EquipWeapon Remote": {
      source: "StarterPlayer.InputCtrl",
      destination: "Server.InventoryService",
      latency: "42ms",
      payload: "weaponId, slot, timestamp",
    },
    "Inventory Service": {
      source: "Server.InventoryService",
      destination: "DataStore.Inventory",
      latency: "57ms",
      payload: "validatedWeaponId, userId",
    },
    "Validation Alert": {
      source: "Server.InventoryService",
      destination: "SecurityReview.Queue",
      latency: "9ms",
      payload: "missing server validation",
    },
    DataStore: {
      source: "DataStore.Inventory",
      destination: "Persistence Layer",
      latency: "84ms",
      payload: "inventory delta",
    },
  };

  function selectNode(node) {
    const name = node.dataset.node;
    const detail = details[name];
    nodes.forEach((item) => item.classList.toggle("active", item === node));
    title.textContent = name;
    source.textContent = detail.source;
    destination.textContent = detail.destination;
    latency.textContent = detail.latency;
    feedLine.textContent = `${name} inspected`;
    tooltip.querySelector("strong").textContent = name;
    tooltip.querySelectorAll("p")[0].textContent = `Payload: ${detail.payload}`;
    tooltip.querySelectorAll("p")[1].textContent = `Latency: ${detail.latency}`;
  }

  nodes.forEach((node) => {
    node.addEventListener("mouseenter", () => selectNode(node));
    node.addEventListener("click", () => selectNode(node));

    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    node.addEventListener("pointerdown", (event) => {
      dragging = true;
      const box = node.getBoundingClientRect();
      offsetX = event.clientX - box.left;
      offsetY = event.clientY - box.top;
      node.setPointerCapture(event.pointerId);
    });

    node.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const graphBox = graph.getBoundingClientRect();
      const x = event.clientX - graphBox.left - offsetX;
      const y = event.clientY - graphBox.top - offsetY;
      node.style.left = `${Math.max(8, Math.min(graphBox.width - node.offsetWidth - 8, x))}px`;
      node.style.top = `${Math.max(8, Math.min(graphBox.height - node.offsetHeight - 8, y))}px`;
      node.style.right = "auto";
      node.style.bottom = "auto";
    });

    node.addEventListener("pointerup", () => {
      dragging = false;
    });
  });

  replayButton?.addEventListener("click", () => {
    feedLine.textContent = "Replay started: 7 network events";
    replayHead.style.animation = "none";
    void replayHead.offsetWidth;
    replayHead.style.animation = "";
  });

  assistantButton?.addEventListener("click", () => {
    feedLine.textContent = "Assistant query: Where is player currency modified?";
    const remoteNode = document.querySelector('[data-node="Validation Alert"]');
    if (remoteNode) selectNode(remoteNode);
  });
}

function initMagneticButtons() {
  if (reducedMotion) return;
  document.querySelectorAll(".magnetic").forEach((button) => {
    button.addEventListener("mousemove", (event) => {
      const box = button.getBoundingClientRect();
      const x = (event.clientX - box.left - box.width / 2) * 0.12;
      const y = (event.clientY - box.top - box.height / 2) * 0.12;
      button.style.transform = `translate(${x}px, ${y}px)`;
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "";
    });
  });
}

function initScrollReveal() {
  const revealItems = document.querySelectorAll(".story-card, .price-card, .deploy-steps article");
  if (!("IntersectionObserver" in window) || reducedMotion) {
    revealItems.forEach((item) => item.classList.add("revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

initNetworkField();
initInteractiveDemo();
initMagneticButtons();
initScrollReveal();
