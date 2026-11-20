"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Tag,
  Radio,
  Server,
  HardDrive,
  Network,
  User,
  Wifi,
  Cloud,
  Move,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { TopologySelectedNode } from "./TopologyDetailModal";

interface CiscoPacketTracerCanvasProps {
  routers?: any[];
  isps?: any[];
  olts: any[];
  unassignedOdps?: any[];
  unassignedCustomers?: any[];
  unassignedPartners?: any[];
  onSelectNode: (node: TopologySelectedNode) => void;
}

interface LayoutNode {
  id: string;
  type: "CLOUD" | "CORE" | "OLT" | "ODP" | "CUSTOMER" | "PARTNER";
  label: string;
  sublabel: string;
  extra?: string;
  x: number;
  y: number;
  data: any;
  parentInfo?: any;
  signalDbm?: number | null;
  status?: string;
}

interface LayoutLink {
  id: string;
  sourceId: string;
  targetId: string;
  source: { x: number; y: number };
  target: { x: number; y: number };
  type: "FIBER_TRUNK" | "PON_FEEDER" | "CASCADE" | "DROPCORE";
  label?: string;
  status?: "NORMAL" | "WARNING" | "CRITICAL" | "OFFLINE";
  signalDbm?: number | null;
}

export default function CiscoPacketTracerCanvas({
  routers = [],
  isps = [],
  olts,
  unassignedOdps = [],
  unassignedCustomers = [],
  unassignedPartners = [],
  onSelectNode,
}: CiscoPacketTracerCanvasProps) {
  // Zoom & Pan
  const [scale, setScale] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [showSignalLights, setShowSignalLights] = useState(true);
  const [selectedOltFilter, setSelectedOltFilter] = useState<string>("ALL");

  // Draggable Custom Positions (nodeId -> {x, y})
  const [customPositions, setCustomPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [activeDraggingId, setActiveDraggingId] = useState<string | null>(null);

  const dragRef = useRef<{
    nodeId: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    hasMoved: boolean;
  } | null>(null);

  // Load saved positions from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tapaknet_custom_topology_layout");
      if (saved) {
        setCustomPositions(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Filter OLTs
  const displayOlts = useMemo(() => {
    if (selectedOltFilter === "ALL") return olts;
    return olts.filter((o) => o.id === selectedOltFilter);
  }, [olts, selectedOltFilter]);

  // Layout Engine: Calculate default initial Cisco grid coordinates
  const { nodes, links, canvasWidth, canvasHeight } = useMemo(() => {
    const calculatedNodes: LayoutNode[] = [];
    const calculatedLinks: LayoutLink[] = [];

    const CLIENT_WIDTH = 130;
    const MIN_ODP_WIDTH = 180;
    const LAYER_Y = {
      CLOUD: 70,
      CORE: 190,
      OLT: 320,
      ODP: 470,
      SUB_ODP: 610,
    };

    // 1. Build map of all ODPs across OLTs and unassigned
    const allOdpsMap = new Map<string, any>();
    for (const olt of olts) {
      for (const odp of olt.odpNodes || []) {
        allOdpsMap.set(odp.id, odp);
      }
    }
    for (const odp of unassignedOdps || []) {
      allOdpsMap.set(odp.id, odp);
    }

    interface OdpTreeNode {
      odp: any;
      olt: any;
      clients: any[];
      children: OdpTreeNode[];
      width: number;
      x: number;
      y: number;
      depth: number;
    }

    let globalMaxDepth = 0;

    // Recursive tree builder
    function buildOdpTree(odp: any, olt: any, depth = 0): OdpTreeNode {
      if (depth > globalMaxDepth) globalMaxDepth = depth;

      const clients = [
        ...((odp.homeCustomers || []).map((c: any) => ({ ...c, _clientType: "CUSTOMER" }))),
        ...((odp.hotspotPartners || []).map((p: any) => ({ ...p, _clientType: "PARTNER" }))),
      ].sort((a: any, b: any) => (a.odpPort || 0) - (b.odpPort || 0));

      const clientWidth = Math.max(MIN_ODP_WIDTH, clients.length * CLIENT_WIDTH + 40);

      // Find children in allOdpsMap (child splitters branching from this ODP)
      const rawChildren = Array.from(allOdpsMap.values()).filter(
        (c: any) => c.parentOdpId === odp.id && c.id !== odp.id
      );

      const children = rawChildren.map((ch) => buildOdpTree(ch, olt, depth + 1));
      const childrenWidth = children.reduce((sum: number, ch: OdpTreeNode) => sum + ch.width, 0);

      let width = clientWidth;
      if (children.length > 0 && clients.length > 0) {
        width = clientWidth + childrenWidth + 40;
      } else if (children.length > 0) {
        width = Math.max(clientWidth, childrenWidth);
      }

      const y = depth === 0 ? LAYER_Y.ODP : LAYER_Y.SUB_ODP + (depth - 1) * 140;

      return {
        odp,
        olt,
        clients,
        children,
        width,
        x: 0,
        y,
        depth,
      };
    }

    // Recursive layout coordinate assignment
    function layoutOdpTree(treeNode: OdpTreeNode, startX: number) {
      const clientWidth = Math.max(MIN_ODP_WIDTH, treeNode.clients.length * CLIENT_WIDTH + 40);

      if (treeNode.children.length === 0) {
        treeNode.x = startX + treeNode.width / 2;
        const clientStartX = treeNode.x - ((treeNode.clients.length - 1) * CLIENT_WIDTH) / 2;
        treeNode.clients.forEach((c: any, idx: number) => {
          c._x = clientStartX + idx * CLIENT_WIDTH;
        });
      } else if (treeNode.clients.length === 0) {
        treeNode.x = startX + treeNode.width / 2;
        let currX = startX;
        for (const child of treeNode.children) {
          layoutOdpTree(child, currX);
          currX += child.width;
        }
      } else {
        treeNode.x = startX + clientWidth / 2;
        const clientStartX = treeNode.x - ((treeNode.clients.length - 1) * CLIENT_WIDTH) / 2;
        treeNode.clients.forEach((c: any, idx: number) => {
          c._x = clientStartX + idx * CLIENT_WIDTH;
        });

        let currX = startX + clientWidth + 40;
        for (const child of treeNode.children) {
          layoutOdpTree(child, currX);
          currX += child.width;
        }
      }
    }

    // Structure OLT boxes with their hierarchical ODP trees
    interface OltBox {
      olt: any;
      width: number;
      odpTrees: OdpTreeNode[];
      x: number;
      y: number;
    }

    const oltBoxes: OltBox[] = [];

    for (const olt of displayOlts) {
      const allOltOdps = olt.odpNodes || [];
      // Root ODPs: not connected to any parent ODP, or parent not in map
      const rootOdps = allOltOdps.filter(
        (o: any) => !o.parentOdpId || !allOdpsMap.has(o.parentOdpId)
      );

      const odpTrees = rootOdps.map((o: any) => buildOdpTree(o, olt, 0));
      const totalTreesWidth =
        odpTrees.length > 0 ? odpTrees.reduce((sum: number, t: OdpTreeNode) => sum + t.width, 0) : 260;

      oltBoxes.push({
        olt,
        width: Math.max(300, totalTreesWidth + 60),
        odpTrees,
        x: 0,
        y: LAYER_Y.OLT,
      });
    }

    // Standalone ODP Trees (not linked to any OLT)
    const standaloneRootOdps = (unassignedOdps || []).filter(
      (o: any) => !o.parentOdpId || !allOdpsMap.has(o.parentOdpId)
    );
    const standaloneTrees = standaloneRootOdps.map((o: any) => buildOdpTree(o, null, 0));
    const totalStandaloneWidth =
      standaloneTrees.length > 0 ? standaloneTrees.reduce((sum: number, t: OdpTreeNode) => sum + t.width, 0) : 0;

    const totalNetworkWidth = Math.max(
      1200,
      oltBoxes.reduce((sum: number, b: OltBox) => sum + b.width, 0) +
        (totalStandaloneWidth > 0 ? totalStandaloneWidth + 120 : 0) +
        160
    );

    const clientLayerY = Math.max(760, LAYER_Y.ODP + (globalMaxDepth + 1) * 140);
    const totalNetworkHeight = clientLayerY + 140;
    const rootX = totalNetworkWidth / 2;

    // Assign X positions for OLTs
    let currentOltX = 80;
    for (const oltBox of oltBoxes) {
      oltBox.x = currentOltX + oltBox.width / 2;
      currentOltX += oltBox.width;
    }

    // 1. Layout Router Devices (MikroTik / POPs)
    const routerMap: Record<string, { id: string; x: number; y: number; node: LayoutNode }> = {};
    const coreRouter = routers.find((r) => r.isCoreGateway) || routers[0];

    if (routers.length > 0) {
      const assignedXPerRouter: Record<string, number[]> = {};
      for (const oltBox of oltBoxes) {
        const rId = oltBox.olt.routerId || (coreRouter ? coreRouter.id : "");
        if (rId) {
          if (!assignedXPerRouter[rId]) assignedXPerRouter[rId] = [];
          assignedXPerRouter[rId].push(oltBox.x);
        }
      }

      routers.forEach((r, idx) => {
        const xs = assignedXPerRouter[r.id];
        let rX: number;
        if (xs && xs.length > 0) {
          rX = xs.reduce((a, b) => a + b, 0) / xs.length;
        } else {
          rX = (totalNetworkWidth / (routers.length + 1)) * (idx + 1);
        }

        const rNode: LayoutNode = {
          id: `node-router-${r.id}`,
          type: "CORE",
          label: r.name,
          sublabel: `${r.brandModel} (${r.siteLocation})`,
          extra: r.ipAddress ? `IP: ${r.ipAddress}` : undefined,
          x: rX,
          y: LAYER_Y.CORE,
          data: r,
        };
        calculatedNodes.push(rNode);
        routerMap[r.id] = { id: rNode.id, x: rX, y: LAYER_Y.CORE, node: rNode };
      });
    } else {
      const defaultCoreNode: LayoutNode = {
        id: "node-core",
        type: "CORE",
        label: "Core Router NOC",
        sublabel: "MikroTik CCR Gateway",
        extra: "192.168.10.1",
        x: rootX,
        y: LAYER_Y.CORE,
        data: { name: "Core Router NOC TapakNet" },
      };
      calculatedNodes.push(defaultCoreNode);
      routerMap["_default"] = { id: "node-core", x: rootX, y: LAYER_Y.CORE, node: defaultCoreNode };
    }

    // 2. Layout ISP Upstream Providers
    if (isps.length > 0) {
      isps.forEach((isp, idx) => {
        let targetRouter = isp.routerId ? routerMap[isp.routerId] : undefined;
        if (!targetRouter) {
          targetRouter = coreRouter ? routerMap[coreRouter.id] : Object.values(routerMap)[0];
        }

        const ispX = targetRouter
          ? targetRouter.x + (isps.length > 1 ? (idx - (isps.length - 1) / 2) * 160 : 0)
          : (totalNetworkWidth / (isps.length + 1)) * (idx + 1);

        const ispNode: LayoutNode = {
          id: `node-isp-${isp.id}`,
          type: "CLOUD",
          label: isp.name,
          sublabel: `${isp.bandwidthMbps} Mbps (${isp.serviceType})`,
          extra: isp.circuitId ? `CID: ${isp.circuitId}` : undefined,
          x: ispX,
          y: LAYER_Y.CLOUD,
          data: isp,
        };
        calculatedNodes.push(ispNode);

        if (targetRouter) {
          calculatedLinks.push({
            id: `link-isp-${isp.id}-to-${targetRouter.id}`,
            sourceId: ispNode.id,
            targetId: targetRouter.id,
            source: { x: ispX, y: LAYER_Y.CLOUD },
            target: { x: targetRouter.x, y: targetRouter.y },
            type: "FIBER_TRUNK",
            label: `${isp.bandwidthMbps}M Transit`,
            status: "NORMAL",
          });
        }
      });
    } else {
      const defaultCloudNode: LayoutNode = {
        id: "node-cloud",
        type: "CLOUD",
        label: "ISP Upstream Gateway",
        sublabel: "Fiber 1 Gbps / BGP Transit",
        x: rootX,
        y: LAYER_Y.CLOUD,
        data: { name: "Internet / ISP Gateway" },
      };
      calculatedNodes.push(defaultCloudNode);

      const defaultTarget = coreRouter ? routerMap[coreRouter.id] : Object.values(routerMap)[0];
      if (defaultTarget) {
        calculatedLinks.push({
          id: "link-cloud-core",
          sourceId: "node-cloud",
          targetId: defaultTarget.id,
          source: { x: rootX, y: LAYER_Y.CLOUD },
          target: { x: defaultTarget.x, y: defaultTarget.y },
          type: "FIBER_TRUNK",
          label: "Uplink ISP 1G",
          status: "NORMAL",
        });
      }
    }

    // Helper to recursively render ODP tree nodes and cables
    function renderOdpTree(treeNode: OdpTreeNode) {
      calculatedNodes.push({
        id: `node-odp-${treeNode.odp.id}`,
        type: "ODP",
        label: treeNode.odp.code,
        sublabel: treeNode.odp.parentOdp
          ? `ODP ${treeNode.odp.parentOdp.code} (P${treeNode.odp.parentOdpPort || 1})`
          : treeNode.olt
          ? `PON ${treeNode.odp.ponPortNumber} • 1:${treeNode.odp.splitterCapacity}`
          : `Standalone • 1:${treeNode.odp.splitterCapacity}`,
        extra: treeNode.odp.opticalPowerDbm ? `${treeNode.odp.opticalPowerDbm} dBm` : "ODP Box",
        signalDbm: treeNode.odp.opticalPowerDbm,
        x: treeNode.x,
        y: treeNode.y,
        data: treeNode.odp,
        parentInfo: {
          oltName: treeNode.olt?.name,
          ponPort: treeNode.odp.ponPortNumber,
          odpCode: treeNode.odp.parentOdp?.code,
          portNumber: treeNode.odp.parentOdpPort,
        },
      });

      const odpSignal = treeNode.odp.opticalPowerDbm;
      let odpLinkStatus: LayoutLink["status"] = "NORMAL";
      if (odpSignal !== null && odpSignal !== undefined) {
        if (odpSignal < -24) odpLinkStatus = "CRITICAL";
        else if (odpSignal < -20) odpLinkStatus = "WARNING";
      }

      // Link upstream
      if (treeNode.depth === 0) {
        // Root ODP connected to OLT
        if (treeNode.olt) {
          calculatedLinks.push({
            id: `link-olt-odp-${treeNode.odp.id}`,
            sourceId: `node-olt-${treeNode.olt.id}`,
            targetId: `node-odp-${treeNode.odp.id}`,
            source: { x: treeNode.olt.x, y: LAYER_Y.OLT },
            target: { x: treeNode.x, y: treeNode.y },
            type: "PON_FEEDER",
            label: `PON ${treeNode.odp.ponPortNumber}`,
            status: odpLinkStatus,
            signalDbm: odpSignal,
          });
        }
      } else {
        // Child Splitter ODP -> Link from parent ODP!
        calculatedLinks.push({
          id: `link-cascade-odp-${treeNode.odp.parentOdpId}-to-${treeNode.odp.id}`,
          sourceId: `node-odp-${treeNode.odp.parentOdpId}`,
          targetId: `node-odp-${treeNode.odp.id}`,
          source: { x: treeNode.x, y: treeNode.y },
          target: { x: treeNode.x, y: treeNode.y },
          type: "CASCADE",
          label: `Splitter P${treeNode.odp.parentOdpPort || 1}`,
          status: odpLinkStatus,
          signalDbm: odpSignal,
        });
      }

      // Direct Clients of this ODP
      treeNode.clients.forEach((client: any, cIdx: number) => {
        const isCust = client._clientType === "CUSTOMER";
        const clientSignal = isCust ? client.signalDbm : odpSignal;
        let clientLinkStatus: LayoutLink["status"] = "NORMAL";
        if (clientSignal !== null && clientSignal !== undefined) {
          if (clientSignal < -24) clientLinkStatus = "CRITICAL";
          else if (clientSignal < -20) clientLinkStatus = "WARNING";
        }
        if (isCust && client.status === "INACTIVE") {
          clientLinkStatus = "OFFLINE";
        }

        calculatedNodes.push({
          id: `node-client-${client.id}`,
          type: isCust ? "CUSTOMER" : "PARTNER",
          label: client.name,
          sublabel: isCust
            ? client.packageName || "PPPoE Home"
            : `Mitra (${client.ownerName || "Hotspot"})`,
          extra: client.odpPort ? `Port ${client.odpPort}` : undefined,
          signalDbm: isCust ? client.signalDbm : null,
          status: isCust ? client.status : "ACTIVE",
          x: client._x,
          y: clientLayerY,
          data: client,
          parentInfo: {
            oltName: treeNode.olt?.name,
            ponPort: treeNode.odp.ponPortNumber,
            odpCode: treeNode.odp.code,
            portNumber: client.odpPort,
          },
        });

        // Link: ODP -> Client (Dropcore)
        calculatedLinks.push({
          id: `link-odp-client-${client.id}`,
          sourceId: `node-odp-${treeNode.odp.id}`,
          targetId: `node-client-${client.id}`,
          source: { x: treeNode.x, y: treeNode.y },
          target: { x: client._x, y: clientLayerY },
          type: "DROPCORE",
          label: `Port ${client.odpPort || cIdx + 1}`,
          status: clientLinkStatus,
          signalDbm: isCust ? client.signalDbm : null,
        });
      });

      // Recurse for child trees
      for (const child of treeNode.children) {
        renderOdpTree(child);
      }
    }

    // 3. Position OLTs and their ODP trees
    let currentXCursor = 80;

    for (const oltBox of oltBoxes) {
      // Add OLT Node
      calculatedNodes.push({
        id: `node-olt-${oltBox.olt.id}`,
        type: "OLT",
        label: oltBox.olt.name,
        sublabel: oltBox.olt.brandModel,
        extra: `IP: ${oltBox.olt.localIp || "DHCP"}`,
        x: oltBox.x,
        y: LAYER_Y.OLT,
        data: oltBox.olt,
      });

      // Link: Router -> OLT
      let attachedRouter = oltBox.olt.routerId ? routerMap[oltBox.olt.routerId] : undefined;
      if (!attachedRouter) {
        attachedRouter = coreRouter ? routerMap[coreRouter.id] : Object.values(routerMap)[0];
      }

      if (attachedRouter) {
        calculatedLinks.push({
          id: `link-router-${attachedRouter.id}-olt-${oltBox.olt.id}`,
          sourceId: attachedRouter.id,
          targetId: `node-olt-${oltBox.olt.id}`,
          source: { x: attachedRouter.x, y: attachedRouter.y },
          target: { x: oltBox.x, y: LAYER_Y.OLT },
          type: "FIBER_TRUNK",
          label: "Trunk Uplink",
          status: "NORMAL",
        });
      }

      // Layout ODP trees under this OLT
      let oltOdpStartX = currentXCursor;
      for (const tree of oltBox.odpTrees) {
        layoutOdpTree(tree, oltOdpStartX);
        renderOdpTree(tree);
        oltOdpStartX += tree.width;
      }

      currentXCursor += oltBox.width;
    }

    // 4. Standalone ODP Trees
    if (standaloneTrees.length > 0) {
      let standaloneStartX = currentXCursor + 40;
      for (const tree of standaloneTrees) {
        layoutOdpTree(tree, standaloneStartX);
        renderOdpTree(tree);
        standaloneStartX += tree.width;
      }
    }

    return {
      nodes: calculatedNodes,
      links: calculatedLinks,
      canvasWidth: totalNetworkWidth,
      canvasHeight: totalNetworkHeight,
    };
  }, [displayOlts, unassignedOdps, routers, isps]);

  // Combined node positions map (Custom position if dragged, otherwise default layout)
  const posMap = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    for (const node of nodes) {
      map[node.id] = customPositions[node.id] || { x: node.x, y: node.y };
    }
    return map;
  }, [nodes, customPositions]);

  // DRAG & DROP HANDLERS WITH POINTER CAPTURE
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    node: LayoutNode
  ) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    const currentPos = posMap[node.id] || { x: node.x, y: node.y };

    dragRef.current = {
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      originX: currentPos.x,
      originY: currentPos.y,
      hasMoved: false,
    };

    setActiveDraggingId(node.id);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const dragInfo = dragRef.current;
    if (!dragInfo) return;

    const dx = (e.clientX - dragInfo.startX) / scale;
    const dy = (e.clientY - dragInfo.startY) / scale;

    if (Math.hypot(dx, dy) > 4) {
      dragInfo.hasMoved = true;
    }

    const newX = Math.round(
      Math.max(40, Math.min(canvasWidth - 40, dragInfo.originX + dx))
    );
    const newY = Math.round(
      Math.max(40, Math.min(canvasHeight - 40, dragInfo.originY + dy))
    );

    const targetNodeId = dragInfo.nodeId;

    setCustomPositions((prev) => ({
      ...prev,
      [targetNodeId]: { x: newX, y: newY },
    }));
  };

  const handlePointerUp = (
    e: React.PointerEvent<HTMLDivElement>,
    node: LayoutNode
  ) => {
    const dragInfo = dragRef.current;
    if (!dragInfo) return;

    const wasMoved = dragInfo.hasMoved;
    const targetNodeId = dragInfo.nodeId;

    dragRef.current = null;
    setActiveDraggingId(null);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (!wasMoved) {
      // It was a click (not a drag): open technical inspection modal!
      if (node.type !== "CLOUD") {
        onSelectNode({
          type: node.type,
          data: node.data,
          parentInfo: node.parentInfo,
        });
      }
    } else {
      // Save updated custom layout to localStorage
      try {
        setCustomPositions((latest) => {
          try {
            localStorage.setItem(
              "tapaknet_custom_topology_layout",
              JSON.stringify(latest)
            );
          } catch {}
          return latest;
        });
      } catch {}
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    setActiveDraggingId(null);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Reset custom layout to original auto-arranged positions
  const handleResetLayout = () => {
    setCustomPositions({});
    try {
      localStorage.removeItem("tapaknet_custom_topology_layout");
    } catch {}
  };

  // Zoom helpers
  const handleZoomIn = () => setScale((s) => Math.min(2, s + 0.15));
  const handleZoomOut = () => setScale((s) => Math.max(0.4, s - 0.15));
  const handleResetZoom = () => setScale(1);

  // Link status color
  const getLinkColor = (link: LayoutLink) => {
    if (!showSignalLights) {
      if (link.type === "FIBER_TRUNK") return "#F59E0B";
      if (link.type === "PON_FEEDER") return "#0B4EA2";
      if (link.type === "CASCADE") return "#7C3AED";
      return "#475569";
    }

    switch (link.status) {
      case "CRITICAL":
        return "#EF4444";
      case "WARNING":
        return "#F59E0B";
      case "OFFLINE":
        return "#94A3B8";
      case "NORMAL":
      default:
        if (link.type === "FIBER_TRUNK") return "#10B981";
        if (link.type === "PON_FEEDER") return "#2563EB";
        if (link.type === "CASCADE") return "#A855F7";
        return "#059669";
    }
  };

  const hasCustomPositions = Object.keys(customPositions).length > 0;

  return (
    <div className="bg-[#0D1527] rounded-3xl border border-blue-900/40 shadow-2xl overflow-hidden relative text-white flex flex-col">
      {/* Cisco Packet Tracer Workspace Top Toolbar */}
      <div className="bg-[#09101F] border-b border-blue-900/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono font-bold text-blue-200 tracking-wider uppercase text-[11px]">
              Tapak Tracer Canvas
            </span>
          </div>

          <span className="hidden sm:inline-block w-px h-4 bg-blue-800/60" />

          {/* Draggable Hint Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-950 text-cyan-300 border border-cyan-800/50 text-[10px] font-bold">
            <Move className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>Alat Bisa Digeser Bebas</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-slate-400 text-[11px]">
            <span>{nodes.length} Perangkat</span>
            <span>•</span>
            <span>{links.length} Jalur Kabel</span>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* OLT Filter */}
          <select
            value={selectedOltFilter}
            onChange={(e) => setSelectedOltFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-blue-800/60 text-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Semua OLT ({olts.length})</option>
            {olts.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>

          {/* Reset Layout to Default Tree */}
          {hasCustomPositions && (
            <button
              type="button"
              onClick={handleResetLayout}
              className="px-2.5 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/50 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Kembalikan semua perangkat ke tata letak otomatis rapi"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Tata Ulang Asli</span>
            </button>
          )}

          {/* Toggle Labels */}
          <button
            type="button"
            onClick={() => setShowLabels(!showLabels)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showLabels
                ? "bg-blue-600/30 border-blue-400/50 text-blue-300"
                : "bg-slate-900/60 border-slate-700 text-slate-400"
            }`}
            title="Tampilkan / Sembunyikan Label Port Kabel"
          >
            <Tag className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Port Label</span>
          </button>

          {/* Toggle Signal Lights */}
          <button
            type="button"
            onClick={() => setShowSignalLights(!showSignalLights)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showSignalLights
                ? "bg-emerald-600/30 border-emerald-400/50 text-emerald-300"
                : "bg-slate-900/60 border-slate-700 text-slate-400"
            }`}
            title="Lampu Link Kualitas Redaman"
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Lampu Redaman</span>
          </button>

          {/* Zoom In/Out/Reset */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-blue-900/50">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Perkecil (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-slate-400 px-1 min-w-[38px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Perbesar (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Reset Skala 100%"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Cisco Packet Tracer Workspace Viewport */}
      <div className="relative w-full h-[620px] sm:h-[700px] overflow-auto select-none bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px] bg-[#071126]">
        {/* Transformable Canvas */}
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            minWidth: "100%",
          }}
          className="relative transition-transform duration-75 ease-out p-4"
        >
          {/* SVG Connection Lines & Cisco Link Lights Layer */}
          <svg
            width={canvasWidth}
            height={canvasHeight}
            className="absolute top-0 left-0 pointer-events-none z-10"
          >
            <defs>
              <filter id="cisco-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {links.map((link) => {
              const src = posMap[link.sourceId] || link.source;
              const tgt = posMap[link.targetId] || link.target;

              const x1 = src.x;
              const y1 = src.y + 24;
              const x2 = tgt.x;
              const y2 = tgt.y - 24;

              // Orthogonal / S-curve routing
              const midY = (y1 + y2) / 2;
              const pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

              const strokeColor = getLinkColor(link);
              const strokeWidth =
                link.type === "FIBER_TRUNK"
                  ? 3.5
                  : link.type === "PON_FEEDER" || link.type === "CASCADE"
                  ? 2.5
                  : 1.8;

              return (
                <g key={link.id} className="transition-all duration-75">
                  {/* Subtle link shadow/glow */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth + 3}
                    strokeOpacity={0.25}
                  />

                  {/* Main Link Cable Path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={link.status === "OFFLINE" ? "4 4" : undefined}
                    filter={link.status === "NORMAL" ? "url(#cisco-glow)" : undefined}
                  />

                  {/* Packet Tracer Green Triangle Link Lights */}
                  {showSignalLights && (
                    <>
                      {/* Source Link Light */}
                      <circle
                        cx={x1}
                        cy={y1 + 4}
                        r={3.5}
                        fill={strokeColor}
                        className="animate-pulse"
                      />
                      {/* Target Link Light */}
                      <circle
                        cx={x2}
                        cy={y2 - 4}
                        r={3.5}
                        fill={strokeColor}
                        className="animate-pulse"
                      />
                    </>
                  )}

                  {/* Link Label Tag in middle of line */}
                  {showLabels && link.label && (
                    <g transform={`translate(${(x1 + x2) / 2}, ${midY})`}>
                      <rect
                        x="-35"
                        y="-10"
                        width="70"
                        height="18"
                        rx="6"
                        fill="#050C1B"
                        stroke={strokeColor}
                        strokeWidth="1"
                        opacity="0.95"
                      />
                      <text
                        x="0"
                        y="3"
                        fill="#93C5FD"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {link.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Interactive Cisco Hardware Nodes Layer */}
          <div className="relative z-20 w-full h-full pointer-events-auto">
            {nodes.map((node) => {
              const pos = posMap[node.id] || { x: node.x, y: node.y };
              const isDragging = activeDraggingId === node.id;

              return (
                <div
                  key={node.id}
                  style={{
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    transform: "translate(-50%, -50%)",
                    touchAction: "none",
                  }}
                  onPointerDown={(e) => handlePointerDown(e, node)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={(e) => handlePointerUp(e, node)}
                  onPointerCancel={handlePointerCancel}
                  className={`absolute group flex flex-col items-center select-none transition-shadow ${
                    isDragging
                      ? "cursor-grabbing z-40 scale-105"
                      : "cursor-grab z-20 hover:scale-105"
                  }`}
                >
                  {/* Cisco Device Visual Icon Unit */}
                  <div
                    className={`relative flex items-center justify-center transition-transform ${
                      isDragging
                        ? "ring-4 ring-cyan-400 ring-offset-2 ring-offset-[#071126] shadow-2xl rounded-2xl"
                        : ""
                    }`}
                  >
                    {/* 1. CLOUD / ISP GATEWAY */}
                    {node.type === "CLOUD" && (
                      <div className="w-16 h-14 rounded-3xl bg-gradient-to-br from-sky-500/20 to-blue-600/30 border-2 border-sky-400 flex items-center justify-center text-sky-300 shadow-lg shadow-sky-500/20 backdrop-blur-md">
                        <Cloud className="w-8 h-8" />
                      </div>
                    )}

                    {/* 2. CORE ROUTER (Cisco Style Disc) */}
                    {node.type === "CORE" && (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-700 via-indigo-800 to-blue-900 border-2 border-cyan-400 flex flex-col items-center justify-center text-white shadow-xl shadow-cyan-500/25 relative">
                        <div className="flex items-center justify-center w-full h-full relative">
                          <Server className="w-6 h-6 text-cyan-200" />
                          <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        </div>
                      </div>
                    )}

                    {/* 3. OLT CHASSIS (ZTE / HSGQ Chassis) */}
                    {node.type === "OLT" && (
                      <div className="w-20 h-12 rounded-xl bg-gradient-to-b from-slate-800 to-slate-950 border-2 border-indigo-400 flex flex-col items-center justify-between p-1.5 shadow-xl shadow-indigo-950/40 relative">
                        <div className="flex items-center justify-between w-full px-1">
                          <span className="text-[8px] font-mono font-bold text-indigo-300">
                            OLT-PON
                          </span>
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-1 w-full px-1">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div
                              key={i}
                              className="h-2 rounded bg-indigo-900/80 border border-indigo-500/40 flex items-center justify-center"
                            >
                              <span className="w-1 h-1 rounded-full bg-emerald-400" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. ODP SPLITTER BOX (Outdoor Distribution Node) */}
                    {node.type === "ODP" && (
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
                          node.data?.parentOdpId
                            ? "from-indigo-950 via-purple-950 to-slate-900 border-2 border-purple-400 text-purple-300 shadow-lg shadow-purple-950/40"
                            : "from-blue-950 to-slate-900 border-2 border-blue-400 text-blue-300 shadow-lg shadow-blue-950/30"
                        } flex flex-col items-center justify-center relative`}
                      >
                        <Radio
                          className={`w-5 h-5 ${
                            node.data?.parentOdpId ? "text-purple-300" : "text-blue-200"
                          }`}
                        />
                        <span className="text-[8px] font-mono font-bold mt-0.5">
                          1:{node.data?.splitterCapacity || 8}
                        </span>
                        {node.data?.parentOdpId && (
                          <span className="absolute -bottom-1 text-[7px] font-bold px-1 rounded bg-purple-900/90 text-purple-200 border border-purple-400">
                            SUB
                          </span>
                        )}
                        <span
                          className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${
                            node.signalDbm && node.signalDbm < -24
                              ? "bg-rose-500 animate-ping"
                              : node.signalDbm && node.signalDbm < -20
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                          }`}
                        />
                      </div>
                    )}

                    {/* 5. CUSTOMER HOME ONT (ONT Modem) */}
                    {node.type === "CUSTOMER" && (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-md shadow-emerald-950/20 relative">
                        <User className="w-5 h-5 text-emerald-200" />
                        <span
                          className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-slate-900 ${
                            node.status === "ACTIVE"
                              ? "bg-emerald-400"
                              : "bg-amber-400"
                          }`}
                        />
                      </div>
                    )}

                    {/* 6. HOTSPOT PARTNER AP (Wireless AP) */}
                    {node.type === "PARTNER" && (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-950 border-2 border-purple-400 flex items-center justify-center text-purple-300 shadow-md shadow-purple-950/20 relative">
                        <Wifi className="w-5 h-5 text-purple-200" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                      </div>
                    )}
                  </div>

                  {/* Device Text Labels (Cisco Packet Tracer style label tags) */}
                  <div className="mt-2 text-center pointer-events-none max-w-[140px]">
                    <div className="text-[11px] font-extrabold text-white truncate drop-shadow-md">
                      {node.label}
                    </div>
                    <div className="text-[9px] text-blue-200/70 font-mono truncate">
                      {node.sublabel}
                    </div>
                    {node.extra && (
                      <div className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-blue-950/90 text-cyan-300 border border-cyan-800/60">
                        {node.extra}
                      </div>
                    )}
                  </div>

                  {/* Real-time Coordinate pill when actively dragging */}
                  {isDragging && (
                    <div className="absolute -top-7 px-2 py-0.5 rounded-md bg-cyan-500 text-slate-950 font-mono font-bold text-[9px] shadow-lg animate-in zoom-in-75">
                      X: {pos.x}, Y: {pos.y}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cisco Packet Tracer Workspace Legend Bar */}
      <div className="bg-[#09101F] border-t border-blue-900/40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
            Legenda Tapak Tracer:
          </span>

          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1 bg-amber-400 rounded-full" />
            <span>Fiber Trunk ISP</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1 bg-blue-500 rounded-full" />
            <span>Kabel Distribusi PON</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1 bg-emerald-500 rounded-full" />
            <span>Dropcore Pelanggan</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Link Light Aktif (Optimal)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Redaman Waspada</span>
          </div>
        </div>

        <div className="text-[10px] text-cyan-400/80 font-medium">
          🖐️ Tahan & geser perangkat untuk mengatur posisi bebas • Klik 1x untuk melihat detail teknis
        </div>
      </div>
    </div>
  );
}
