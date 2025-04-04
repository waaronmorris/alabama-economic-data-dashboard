import { Observation } from "../types/indicators";
import { loadObservations } from "./observationsService";

export async function calculateMiseryIndex(
  unemploymentData: Observation[],
  inflationData: Observation[],
  metadata: Record<string, any> = {}
): Promise<Observation[]> {
  const miseryIndex: Observation[] = [];

  // Find matching dates between unemployment and inflation data
  unemploymentData.forEach((unemp) => {
    const matchingInflation = inflationData.find((inf) => inf.date === unemp.date);
    if (matchingInflation) {
      const miseryValue = Number(unemp.value) + Number(matchingInflation.value);
      miseryIndex.push({
        ...metadata,
        date: unemp.date,
        value: miseryValue.toString(),
        units: "Percent"
      });
    }
  });

  return miseryIndex;
}

export async function calculateRealInterestRate(
  nominalRateData: Observation[],
  inflationData: Observation[],
  metadata: Record<string, any> = {}
): Promise<Observation[]> {
  const realRate: Observation[] = [];

  nominalRateData.forEach((nominal) => {
    const matchingInflation = inflationData.find((inf) => inf.date === nominal.date);
    if (matchingInflation) {
      const realValue = Number(nominal.value) - Number(matchingInflation.value);
      realRate.push({
        ...metadata,
        date: nominal.date,
        value: realValue.toString(),
        units: "Percent"
      });
    }
  });

  return realRate;
}

export async function loadCompositeIndicator(
  indicatorId: string,
  components: string[],
  metadata: Record<string, any> = {}
): Promise<Observation[]> {
  const componentData = await Promise.all(components.map((componentId) => loadObservations(componentId)));

  switch (indicatorId) {
    case "MISERY_INDEX":
      return calculateMiseryIndex(componentData[0], componentData[1], metadata);
    case "REAL_INTEREST_RATE":
      return calculateRealInterestRate(componentData[0], componentData[1], metadata);
    default:
      throw new Error(`Unknown composite indicator: ${indicatorId}`);
  }
}
