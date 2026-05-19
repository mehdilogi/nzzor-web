import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import BookingFlow from "../../components/BookingFlow";
import { getHotel } from "../../lib/api";

export const metadata = {
  title: "Complete your booking — Nzzor",
  description: "Secure your reservation with instant confirmation.",
};

export default async function BookingPage({ searchParams }) {
  const slug = searchParams?.hotel || "";
  const roomId = searchParams?.room || "";
  const nights = Number(searchParams?.nights) || 1;
  const checkIn = searchParams?.checkIn || "";
  const checkOut = searchParams?.checkOut || "";

  const hotel = slug ? await getHotel(slug, { lang: "en" }) : null;
  const room =
    hotel && hotel.rooms ? hotel.rooms.find((r) => r.id === roomId) || hotel.rooms[0] : null;

  return (
    <>
      <Nav />
      <BookingFlow
        hotel={hotel}
        room={room}
        nights={nights}
        checkIn={checkIn}
        checkOut={checkOut}
      />
      <Footer />
    </>
  );
}
