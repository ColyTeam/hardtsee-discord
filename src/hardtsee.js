/**
 * Reach out to API from weather station at hardtsee and get water temperature
 * @returns water temperature as string in German format
 */
export async function getWaterTemperature() {
  const response = await fetch(scubwUrl, {
    headers: {
      'User-Agent': 'coly:hardtsee-discord:v1.0.0 (message gregor@nycolix.com)',
    },
  });
  if (!response.ok) {
    let errorText = `Error fetching ${response.url}: ${response.status} ${response.statusText}`;
    try {
      const error = await response.text();
      if (error) {
        errorText = `${errorText} \n\n ${error}`;
      }
    } catch {
      // ignore
    }
    throw new Error(errorText);
  }
  const data = await response.json();
  return data.current.extraTemp1.split(' ')[0];
}

export const scubwUrl =
  'https://scubw.duckdns.org/weewx/belchertown/json/weewx_data.json';
