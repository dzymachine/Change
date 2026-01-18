import OnboardingPlaidClientPage from "./page.client";

export default function OnboardingPlaidPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const stepsValue = searchParams.steps;
  const raw = Array.isArray(stepsValue) ? stepsValue[0] : stepsValue;
  const totalSteps = raw === "4" ? 4 : 3;

  return <OnboardingPlaidClientPage totalSteps={totalSteps} />;
}
