export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const camera = searchParams.get("camera");
  const type = searchParams.get("type"); // Determines if it's Arduino data
  let raspiUrl;

  if (type === "arduino") {
    raspiUrl = "https://immune-crow-vastly.ngrok-free.app/data/arduino";
  } else if (camera) {
    raspiUrl = `https://immune-crow-vastly.ngrok-free.app/video/${camera}`;
  } else {
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
  }

  try {
    const response = await fetch(raspiUrl, {
      headers: {
        "Content-Type": type === "arduino" ? "application/json" : "application/octet-stream",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.status}`);
    }

    if (type === "arduino") {
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    } else {
      const stream = response.body;
      return new Response(stream, {
        headers: {
          "Content-Type": "video/mp4", // Adjust based on actual stream type
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  } catch (error) {
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

    const response = await fetch(flaskApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to send move command" }), { status: 500 });
  }
}