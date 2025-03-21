const fetchWithRetry = async (url, options, retries = 3) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok && retries > 0) {
      console.warn(`Retrying... (${retries} attempts left)`);
      return fetchWithRetry(url, options, retries - 1);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying... (${retries} attempts left)`);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const camera = searchParams.get("camera");
  const type = searchParams.get("type"); // Determines if it's Arduino data
  let raspiUrl;

  if (type === "arduino") {
    raspiUrl = "https://immune-crow-vastly.ngrok-free.app/data/arduino";
  } else if (camera) {
    raspiUrl = `https://immune-crow-vastly.ngrok-free.app/video/${camera}`;
  } else if (type === 'connect') {
    raspiUrl = "https://immune-crow-vastly.ngrok-free.app";
  } else {
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
  }

  const contentType = (type === "arduino" || type === 'connect') ? "application/json" : "application/octet-stream";

  try {
    const response = await fetchWithRetry(raspiUrl, {
      headers: {
        "Content-Type": contentType,
      },
      timeout: 5000, // Set a timeout of 5 seconds
    });

    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.status}`);
    }

    if (type === "arduino" || type === 'connect') {
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    } else {
      const stream = response.body;
      return new Response(stream, {
        headers: {
          "Content-Type": "multipart/x-mixed-replace; boundary=frame",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const direction = searchParams.get("direction");

    if (!direction) {
      return new Response(JSON.stringify({ error: "Missing direction parameter" }), { status: 400 });
    }

    const flaskApiUrl = `https://immune-crow-vastly.ngrok-free.app/move/${direction}`;

    const response = await fetchWithRetry(flaskApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      timeout: 5000, // Set a timeout of 5 seconds
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    console.error("Failed to send move command:", error);
    return new Response(JSON.stringify({ error: "Failed to send move command" }), { status: 500 });
  }
}