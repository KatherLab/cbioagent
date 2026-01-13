export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') || ''
  const query = getQuery(event)

  // Build query string
  const queryString = new URLSearchParams(
    Object.entries(query).map(([k, v]) => [k, String(v)])
  ).toString()

  const url = `https://www.cbioportal.org/api/${path}${queryString ? `?${queryString}` : ''}`

  // Read body for POST/PUT requests
  let body: Record<string, unknown> | undefined = undefined
  if (event.method === 'POST' || event.method === 'PUT') {
    body = await readBody(event)
  }

  try {
    const response = await $fetch(url, {
      method: event.method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: body,
    })
    return response
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string }
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Failed to fetch from cBioPortal',
    })
  }
})
