import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import BookingFlow from "../../components/BookingFlow";
import { getHotel } from "../../lib/api";

export const metadata = {
  title: "Complete your booking — Nzzor",
  description: "Secure your reservation with instant confirmation.",
};

// Parse the multi-room selection param.
//   ?sel=roomId:BOARD:pricePerNight_roomId:BOARD:pricePerNight
// Comma separates rooms; colon separates roomId:board:price within a room.
//   (comma, not underscore, because board codes like HALF_BOARD contain "_")
function parseSelections(sel) {
  if (!sel) return null;
  const out = [];
  for (const chunk of String(sel).split(",")) {
    if (!chunk) continue;
    const [roomId, board, price] = chunk.split(":");
    if (!roomId) continue;
    out.push({
      roomId,
      board: board || null,
      pricePerNight: price ? parseInt(price, 10) || null : null,
    });
  }
  return out.length ? out : null;
}

export default async function BookingPage({ searchParams }) {
  const slug = searchParams?.hotel || "";
  const nights = Number(searchParams?.nights) || 1;
  const checkIn = searchParams?.checkIn || "";
  const checkOut = searchParams?.checkOut || "";

  const hotel = slug ? await getHotel(slug, { lang: "en" }) : null;

  const parsedSel = parseSelections(searchParams?.sel);

  let selections = null;
  if (hotel && hotel.rooms && parsedSel) {
    selections = parsedSel
      .map((s) => {
        const room = hotel.rooms.find((r) => r.id === s.roomId);
        if (!room) return null;
        return {
          room,
          board: s.board,
          pricePerNight: s.pricePerNight || room.price,
        };
      })
      .filter(Boolean);
    if (selections.length === 0) selections = null;
  }

  // Backward-compatible single-room path: old ?room=&board=&bp= links still work.
  if (!selections && hotel && hotel.rooms) {
    const roomId = searchParams?.room || "";
    const room = hotel.rooms.find((r) => r.id === roomId) || hotel.rooms[0] || null;
    if (room) {
      const roomsQty = Math.min(10, Math.max(1, Number(searchParams?.rooms) || 1));
      const board = searchParams?.board || null;
      const bp = searchParams?.bp ? parseInt(searchParams.bp, 10) || null : null;
      selections = Array.from({ length: roomsQty }, () => ({
        room,
        board,
        pricePerNight: bp || room.price,
      }));
    }
  }

  return (
    <>
      <Nav />
      <BookingFlow
        hotel={hotel}
        selections={selections}
        nights={nights}
        checkIn={checkIn}
        checkOut={checkOut}
      />
      <Footer />
    </>
  );
}
