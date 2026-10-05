export const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xnpjaewn';

export async function submitToFormspree(
  payload: Record<string, unknown>
): Promise<{ ok: boolean; errorMessage?: string }> {
  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        submitted_at: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      return { ok: true };
    }

    const data = await response.json().catch(() => null);
    const errorMessage =
      data?.errors?.map((err: { message: string }) => err.message).join(', ') ||
      'Submission could not be completed. Please try again.';
    return { ok: false, errorMessage };
  } catch {
    return {
      ok: false,
      errorMessage: 'Network error while connecting to Formspree.',
    };
  }
}
