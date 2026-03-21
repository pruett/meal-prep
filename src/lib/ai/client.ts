export async function callAiApi(
  endpoint: string,
  body?: Record<string, unknown>,
) {
  const response = await fetch(`/api/ai/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...(body && { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Failed: ${endpoint}`);
  }
  return data;
}
