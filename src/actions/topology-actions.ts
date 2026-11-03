"use server";

import { prisma } from "@/lib/prisma";

export interface TopologySummary {
  totalOlts: number;
  totalPonPorts: number;
  totalOdps: number;
  totalCapacity: number;
  totalUsedPorts: number;
  occupancyRate: number;
  totalCustomers: number;
  activeCustomers: number;
  isolatedCustomers: number;
  totalPartners: number;
  avgOdpSignal: number | null;
}

export async function getTopologyData() {
  try {
    const [routers, isps, olts, unassignedOdps, unassignedCustomers, unassignedPartners] =
      await Promise.all([
        prisma.routerDevice.findMany({
          orderBy: [{ isCoreGateway: "desc" }, { name: "asc" }],
          include: {
            ispProviders: true,
          },
        }),
        prisma.ispProvider.findMany({
          orderBy: { name: "asc" },
          include: {
            router: true,
          },
        }),
        prisma.oltDevice.findMany({
          orderBy: { name: "asc" },
          include: {
            router: true,
            odpNodes: {
              orderBy: [{ ponPortNumber: "asc" }, { code: "asc" }],
              include: {
                homeCustomers: {
                  include: {
                    devices: true,
                  },
                  orderBy: { odpPort: "asc" },
                },
                hotspotPartners: {
                  include: {
                    devices: true,
                  },
                  orderBy: { odpPort: "asc" },
                },
              },
            },
          },
        }),
        prisma.odpNode.findMany({
          where: { oltId: null },
          orderBy: { code: "asc" },
          include: {
            homeCustomers: {
              include: {
                devices: true,
              },
              orderBy: { odpPort: "asc" },
            },
            hotspotPartners: {
              include: {
                devices: true,
              },
              orderBy: { odpPort: "asc" },
            },
          },
        }),
        prisma.homeCustomer.findMany({
          where: { odpId: null },
          orderBy: { name: "asc" },
          include: {
            devices: true,
          },
        }),
        prisma.hotspotPartner.findMany({
          where: { odpId: null },
          orderBy: { name: "asc" },
          include: {
            devices: true,
          },
        }),
      ]);

    // Calculate aggregated statistics
    let totalPonPorts = 0;
    let totalOdps = unassignedOdps.length;
    let totalCapacity = 0;
    let totalUsedPorts = 0;
    let odpSignalSum = 0;
    let odpSignalCount = 0;
    let totalCustomers = unassignedCustomers.length;
    let activeCustomers = unassignedCustomers.filter((c) => c.status === "ACTIVE").length;
    let isolatedCustomers = unassignedCustomers.filter((c) => c.status === "ISOLATED").length;
    let totalPartners = unassignedPartners.length;

    for (const odp of unassignedOdps) {
      totalCapacity += odp.splitterCapacity;
      totalUsedPorts += odp.homeCustomers.length + odp.hotspotPartners.length;
      totalCustomers += odp.homeCustomers.length;
      activeCustomers += odp.homeCustomers.filter((c) => c.status === "ACTIVE").length;
      isolatedCustomers += odp.homeCustomers.filter((c) => c.status === "ISOLATED").length;
      totalPartners += odp.hotspotPartners.length;

      if (odp.opticalPowerDbm !== null && odp.opticalPowerDbm !== undefined) {
        odpSignalSum += odp.opticalPowerDbm;
        odpSignalCount += 1;
      }
    }

    for (const olt of olts) {
      totalPonPorts += olt.ponPortsCount;
      totalOdps += olt.odpNodes.length;

      for (const odp of olt.odpNodes) {
        totalCapacity += odp.splitterCapacity;
        totalUsedPorts += odp.homeCustomers.length + odp.hotspotPartners.length;
        totalCustomers += odp.homeCustomers.length;
        activeCustomers += odp.homeCustomers.filter((c) => c.status === "ACTIVE").length;
        isolatedCustomers += odp.homeCustomers.filter((c) => c.status === "ISOLATED").length;
        totalPartners += odp.hotspotPartners.length;

        if (odp.opticalPowerDbm !== null && odp.opticalPowerDbm !== undefined) {
          odpSignalSum += odp.opticalPowerDbm;
          odpSignalCount += 1;
        }
      }
    }

    const occupancyRate =
      totalCapacity > 0 ? Math.round((totalUsedPorts / totalCapacity) * 100) : 0;

    const avgOdpSignal =
      odpSignalCount > 0 ? parseFloat((odpSignalSum / odpSignalCount).toFixed(1)) : null;

    const summary: TopologySummary = {
      totalOlts: olts.length,
      totalPonPorts,
      totalOdps,
      totalCapacity,
      totalUsedPorts,
      occupancyRate,
      totalCustomers,
      activeCustomers,
      isolatedCustomers,
      totalPartners,
      avgOdpSignal,
    };

    return {
      success: true,
      data: {
        routers,
        isps,
        olts,
        unassignedOdps,
        unassignedCustomers,
        unassignedPartners,
        summary,
      },
    };
  } catch (error: any) {
    console.error("[getTopologyData] Error:", error);
    return {
      success: false,
      error: "Gagal memuat struktur topologi jaringan.",
    };
  }
}
