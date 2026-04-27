import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const barcode = request.nextUrl.searchParams.get("barcode");
  if (!barcode || !/^\d{4,14}$/.test(barcode)) {
    return Response.json({ error: "Check your input." }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();

    if (data.status !== 1 || !data.product) {
      return Response.json({ found: false });
    }

    const product = data.product;
    const name = product.product_name || product.generic_name || null;
    const calories =
      product.nutriments?.["energy-kcal_100g"] ??
      product.nutriments?.["energy-kcal"] ??
      null;

    if (!name || calories === null) {
      return Response.json({ found: false });
    }

    return Response.json({ found: true, name: String(name), calories: Math.round(Number(calories)) });
  } catch {
    return Response.json({ error: "No connection." }, { status: 503 });
  }
}
