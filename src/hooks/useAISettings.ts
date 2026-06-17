// AI is handled by Edufied's backend — no per-user key required.
export const useOpenAIKeyStatus = () => ({
  data: { hasKey: true },
  isLoading: false,
});
